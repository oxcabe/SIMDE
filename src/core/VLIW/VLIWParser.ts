import { apply, buildLexer, expectEOF, expectSingleResult, rep_sc, rep_n, seq, tok, combine, opt_sc, Token, TokenError, list_sc } from 'typescript-parsec';
import { LargeInstruction } from './LargeInstructions';
import { Code } from '../Common/Code';
import { VLIWOperation } from './VLIWOperation';
import { FunctionalUnitType, FunctionalUnitTypeNames, FUNCTIONALUNITTYPESQUANTITY } from '../Common/FunctionalUnit';

enum Tokens {
    Number,
    Comma,
    Space,
    NewLine,
    Comment
}

const tokenizer = buildLexer([
    [true, /^[0-9]+/g, Tokens.Number],
    [true, /^\n+/g, Tokens.NewLine],
    [false, /^\,/g, Tokens.Comma],
    [false, /^[ \t\v\f]+/g, Tokens.Space],
    [false, /^\/\/.*\n/g, Tokens.Comment]
]);

const functionalUnitTypeParser = apply(
    tok(Tokens.Number),
    (num: Token<Tokens.Number>): FunctionalUnitType => {
        let type = +num.text;
        if (type > FUNCTIONALUNITTYPESQUANTITY - 1) {
            throw new TokenError(num.pos, `Invalid functional unit type ${type}`);
        }
        return type;
    }
);

interface IndexParsed {
    index: number;
    isJump: boolean;
    functionalUnitType: FunctionalUnitType;
}


export class VLIWParser {

    public static Parse(input: string, code: Code): LargeInstruction[] {

        // This parses depends on the code, so we moved it here
        const indexParser = apply(
            tok(Tokens.Number),
            (num: Token<Tokens.Number>): IndexParsed => {
                let index = +num.text;
                // Check if index is not out of bounds
                if (index >= code.instructions.length) {
                    throw new TokenError(num.pos, `Invalid index ${index}`);
                }
                return { index: index, isJump: code.isJump(index), functionalUnitType: code.getFunctionalUnitType(index) };
            }
        );

        // This other parsers depends on the previous one, so we need to declare it here also

        let currentIndex: IndexParsed = null; // This is a ugly hack, but unfortunately combine consumes the index that we need in operationParser
        const operationCombiner = combine(indexParser, (indexParsed: IndexParsed) => {
            currentIndex = indexParsed;
            let numOfElements = indexParsed.isJump ? 5 : 2;
            return seq(functionalUnitTypeParser, rep_n(tok(Tokens.Number), numOfElements));
        });

        const operationParser = apply(
            operationCombiner,
            (componets: [FunctionalUnitType, Token<Tokens>[]]) => {
                // Check if we received the right amount of operands
                if (componets[1].length < 2) {
                    throw new TokenError(componets[1][0].pos, `Expected at least 2 operands, received ${componets[1].length}`);
                }

                let index = +currentIndex.index;
                let functionalUnitType = componets[0];
                let functionalUnitIndex = +componets[1][0].text; 
                let predicate = +componets[1][1].text; 

                // Check if the recived functional unit type is the same as the one in the code
                if (functionalUnitType !== currentIndex.functionalUnitType) {
                    throw new TokenError(componets[1][0].pos, `Invalid functional unit type ${FunctionalUnitTypeNames[functionalUnitType]} for instruction ${index}(expected ${FunctionalUnitTypeNames[currentIndex.functionalUnitType]})`);
                }


                let operation = new VLIWOperation(null, code.instructions[index], functionalUnitType, functionalUnitIndex);
                operation.setPred(predicate);

                if (currentIndex.isJump) {
                    // Check if we received the right amount of operands
                    if (componets[1].length !== 5) {
                        throw new TokenError(componets[1][componets[1].length - 1].pos, `Expected 5 operands(Jump operation), received ${componets[1].length}`);
                    }
                    let destiny = +componets[1][2].text;
                    let predTrue = +componets[1][3].text; 
                    let predFalse = +componets[1][4].text;

                    operation.setOperand(2, destiny, '');
                    operation.setPredTrue(predTrue);
                    operation.setPredFalse(predFalse);
                }
                return operation;
            }
        );

        const lineParser = seq(tok(Tokens.Number), rep_sc(operationParser));
        const programParser = seq(tok(Tokens.Number), tok(Tokens.NewLine), list_sc(lineParser, tok(Tokens.NewLine)), opt_sc(tok(Tokens.NewLine)));

        // Lets parse the input
        let result = expectSingleResult(expectEOF(programParser.parse(tokenizer.parse(input))));

        let linesNumber: number = +result[0].text; // Let's extract the amount of lines, this is a retrocompatibility thing, we don't really use it
        let instructions: LargeInstruction[] = new Array<LargeInstruction>(result[2].length);
        let instructionsLines: [Token<Tokens>, VLIWOperation[]][] = result[2];

        for (let i = 0; i < instructionsLines.length; i++) {
            instructions[i] = new LargeInstruction();

            let operationsAmount = +instructionsLines[i][0].text; // This is also a retrocompatibility thing, we don't really use it

            // Iterate over the operations
            instructionsLines[i][1].forEach(operation => {
                instructions[i].addOperation(operation);
            });
        }

        return instructions;
    }

    public static ExportAsString(_instructionNumber: number, _instructions: LargeInstruction[]): string {

        let outputString: string;
        outputString += _instructionNumber;

        for (let i = 0; i < _instructionNumber; i++) {
            let operationAmount = _instructions[i].getVLIWOperationsNumber();
            outputString += operationAmount;

            for (let j = 0; j < operationAmount; j++) {

                let operation = _instructions[i].getOperation(j);
                outputString += '\t';
                outputString += operation.id;
                outputString += ' ';
                outputString += operation.getFunctionalUnitType();
                outputString += ' ';
                outputString += operation.getFunctionalUnitType();
                outputString += ' ';
                outputString += operation.getPred();

                if (operation.isJump()) {
                    outputString += ' ';
                    outputString += operation.getOperand(2);
                    outputString += ' ';
                    outputString += operation.getPredTrue();
                    outputString += ' ';
                    outputString += operation.getPredFalse();
                }
            }
            outputString += '\n';
        }
        return outputString;
    }
}
