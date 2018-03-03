import { Code } from './core/Common/Code';
import { Superescalar } from './core/Superescalar/Superescalar';
import { SuperescalarStatus } from './core/Superescalar/SuperescalarEnums';
import { FunctionalUnitType } from './core/Common/FunctionalUnit';
import { ExecutionStatus } from './main-consts';

import { 
      nextPrefetchCycle,
      nextDecoderCycle,
      nextJumpTableCycle,
      nextFunctionalUnitCycle,
      nextReserveStationCycle,
      nextReorderBufferCycle,
      nextRegistersCycle,
      nextMemoryCycle,
      nextReorderBufferMapperCycle,
      nextCycle,
      superescalarLoad,
      batchActions
} from './interface/actions';

import { SuperescalarReducers } from './interface/reducers';
import { enableBatching } from './interface/reducers/batching';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import i18n from './i18n'; // initialized i18next instance
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next'; // as we build ourself via webpack

import App from './interface/App';


const styles = require('./main.scss');

// Declare browser vars for Typescript
declare var document;
declare var window;

// Global objects for binding React to the View
export let superescalar = new Superescalar();
let state: any = {};
window.interval = null;
window.state = state;
window.backStep = 0;

/*
 * This call all the components to update the state
 * if there is a step param, the components will use
 * their history to set the appropiate content
 */
let dispatchAllSuperescalarActions = (step?: number) => {
      // Code should only be setted on the first iteration
      store.dispatch(
            batchActions(
                  nextJumpTableCycle(superescalar.jumpPrediction),
                  nextPrefetchCycle(superescalar.prefetchUnit),
                  nextDecoderCycle(superescalar.decoder),
                  nextFunctionalUnitCycle([...superescalar.functionalUnit, superescalar.aluMem]),
                  nextReserveStationCycle(
                        [{
                              data: superescalar.reserveStationEntry[0],
                              size: superescalar.getReserveStationSize(0)
                        },

                        {
                              data: superescalar.reserveStationEntry[1],
                              size: superescalar.getReserveStationSize(1)
                        },

                        {
                              data: superescalar.reserveStationEntry[2],
                              size: superescalar.getReserveStationSize(2)
                        },

                        {
                              data: superescalar.reserveStationEntry[3],
                              size: superescalar.getReserveStationSize(3)
                        },

                        {
                              data: superescalar.reserveStationEntry[4],
                              size: superescalar.getReserveStationSize(4)
                        },

                        {
                              data: superescalar.reserveStationEntry[5],
                              size: superescalar.getReserveStationSize(5)
                        }
                  ]),
                  nextReorderBufferMapperCycle([superescalar.ROBGpr, superescalar.ROBFpr]),
                  nextReorderBufferCycle(superescalar.reorderBuffer.elements),
                  nextRegistersCycle([superescalar.gpr.content, superescalar.fpr.content]),
                  nextMemoryCycle(superescalar.memory.data),
                  nextCycle(superescalar.status.cycle)
            )
      );
};

let superExe = () => {
      superescalar.init(true);
};

// https://github.com/reactjs/redux/issues/911#issuecomment-149361073

let superStep = () => {
      if (window.backStep > 0) {
            window.backStep--;
            dispatchAllSuperescalarActions(window.backStep);
      } else {
            if (window.finishedExecution) {
                  window.finishedExecution = false;
                  dispatchAllSuperescalarActions(-1);
                  superescalar.status.cycle = 0;
            }
            if (superescalar.status.cycle === 0) {
                  let code = Object.assign(new Code(), superescalar.code);
                  superExe();
                  superescalar.code = code;
            }
            let resul = superescalar.tic();
            dispatchAllSuperescalarActions();

            return resul;
      }
};

export let loadSuper = (code: Code) => {
      superExe();
      superescalar.code = code;

      // There is no need to update the code with the rest,
      // it should remain the same during all the program execution
      store.dispatch(superescalarLoad(superescalar.code.instructions));
      dispatchAllSuperescalarActions();
};

let play = () => {
      window.stopCondition = ExecutionStatus.EXECUTABLE;
      window.backStep = 0;
      window.executing = true;
      let speed = calculateSpeed();

      // Check if the execution has finished 
      if (window.finishedExecution) {
            window.finishedExecution = false;
            dispatchAllSuperescalarActions(-1);
            superescalar.status.cycle = 0;
      }
      if (superescalar.status.cycle === 0) {
            let code = Object.assign(new Code(), superescalar.code);
            superExe();
            superescalar.code = code;
      }
      if (speed) {
            executionLoop(speed);
      } else {
            // tslint:disable-next-line:no-empty
            while (superescalar.tic() !== SuperescalarStatus.SUPER_ENDEXE) { }
            dispatchAllSuperescalarActions();
            window.finishedExecution = true;
            window.alert('Done');
      }

};

let pause = () => {
      window.stopCondition = ExecutionStatus.PAUSE;
      window.executing = false;
};

let stop = () => {

      // In normal execution I have to avoid the asynchrnous way of
      // js entering in the interval, the only way I have is to check this
      window.stopCondition = ExecutionStatus.STOP;

      if (!window.executing) {
            window.executing = false;
            dispatchAllSuperescalarActions(-1);
            superescalar.status.cycle = 0;
            let code = Object.assign(new Code(), superescalar.code);
            superExe();
            superescalar.code = code;
      }
};

let stepBack = () => {
      // There is no time travelling for batch mode and initial mode
      if (superescalar.status.cycle > 0 && window.backStep < 10 &&
            (superescalar.status.cycle - window.backStep > 0)) {
            window.backStep++;
            dispatchAllSuperescalarActions(window.backStep);
      }
};

function calculateSpeed() {
      let speed = +document.getElementById('velocidad').value;
      let calculatedSpeed = 2000;
      if (speed) {
            calculatedSpeed /= speed;
      } else {
            calculatedSpeed = 0;
      }

      return calculatedSpeed;
};

function executionLoop(speed) {
      if (!window.stopCondition) {
            setTimeout(() => {
                  let result = superStep();
                  if (!(result === SuperescalarStatus.SUPER_BREAKPOINT || result === SuperescalarStatus.SUPER_ENDEXE)) {
                        executionLoop(speed);
                  } else {
                        if (result === SuperescalarStatus.SUPER_BREAKPOINT) {
                              alert('Ejecución detenida, breakpoint');
                        } else if (result === SuperescalarStatus.SUPER_ENDEXE) {
                              window.finishedExecution = true;
                              alert('Ejecución finalizada');
                        }
                  }
            }, speed);
      } else if (window.stopCondition === ExecutionStatus.STOP) {
            let code = Object.assign(new Code(), superescalar.code);
            superExe();
            superescalar.code = code;
            dispatchAllSuperescalarActions(-1);
      }
}

let saveSuperConfig = (superConfig) => {
      const superConfigKeys = Object.keys(superConfig);
      for (let i = 0; i < (superConfigKeys.length - 2); i++) {
            if (i % 2 === 0) {
                  superescalar.setFunctionalUnitNumber(i,
                        +superConfig[superConfigKeys[i]]);
            } else {
                  superescalar.setFunctionalUnitLatency(i,
                        +superConfig[superConfigKeys[i]]);
            }
      }
      superescalar.memoryFailLatency = +superConfig.cacheFailLatency;
      superescalar.issue = +superConfig.issueGrade;
};

let setOptions = (cacheFailPercentage: number) => {
      superescalar.memory.failProbability = cacheFailPercentage;
};

let colorBlocks = (color) => {
      state['Code']({ color: color });
};

/*
 * For exposing the functions to react and the ts code
 * we need to attach them to the Windows object, so
 * in runtime they will be visible from anywhere.
 */
window.loadSuper = loadSuper;
window.superStep = superStep;
window.superExe = superExe;
window.play = play;
window.stop = stop;
window.pause = pause;
window.stepBack = stepBack;
window.saveSuperConfig = saveSuperConfig;
window.colorBlocks = colorBlocks;
window.stopCondition = ExecutionStatus.EXECUTABLE;
window.finishedExecution = false;
window.executing = false;



let store = createStore(
      enableBatching(SuperescalarReducers),
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);


/*
 * Here is where the react endpoint appears
 *
 */
ReactDOM.render(
      <I18nextProvider i18n={i18n}>
            <Provider store={store}>
                  <App machine={superescalar} />
            </Provider>
      </I18nextProvider>,
      document.getElementById('app')
);
