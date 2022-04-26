import * as React from 'react';
import * as FileInput from 'react-file-reader-input';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { bindActionCreators } from 'redux';
import { toggleVliwLoadContentModal } from '../../../actions/modals';
import VLIWIntegration from '../../../../integration/vliw-integration';
import { ContentIntegration } from '../../../../integration/content-integration';

class VLIWLoadContentModalComponent extends React.Component<any, any> {

      constructor(public props: any) {
            super(props);

            this.close = this.close.bind(this);
            this.loadContent = this.loadContent.bind(this);
      }

      close() {
            this.props.actions.toggleVliwLoadContentModal(false);
      };

      handleInputFileChange = (e, results) => {
            results.forEach(result => {
                const [e, file] = result;
                let a = document.getElementById('contentInput') as HTMLInputElement;
                a.value = e.target.result;
            });
        }
    
      loadContent() {
            try {
                const content = (document.getElementById('contentInput') as HTMLInputElement).value;
                this.setState({error: ''});
                const contentIntegration = new ContentIntegration(content);
                VLIWIntegration.contentIntegration = contentIntegration;
                VLIWIntegration.setFpr(contentIntegration.FPRContent);
                VLIWIntegration.setGpr(contentIntegration.GPRContent);
                VLIWIntegration.setMemory(contentIntegration.MEMContent);
                VLIWIntegration.dispatchAllVLIWActions();
                this.close();
            } catch (error) {
                this.setState({error: error.message});
            }
      }

      render() {
            const [t, i18n] = useTranslation();

            return (
            <Modal className="smd-load_content_modal" show={this.props.isVliwLoadContentModalOpen} onHide={this.close}>
            <Modal.Header closeButton>
                <Modal.Title>{t('loadContentModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <textarea id='contentInput' defaultValue={``}>
                </textarea>
                <div className="smd-load_content_modal-errors">
                    {this.state.error && <div className="smd-forms_error">{this.state.error}</div>}
                </div>
            </Modal.Body>

            <Modal.Footer className="smd-load_modal-footer">
                <div className="smd-load_modal-file_input">
                    <FileInput as='text' onChange={this.handleInputFileChange} accept='.mem'>
                        <Button className='btn btn-primary'>{t('commonButtons.uploadVliwFromFile')}</Button>
                    </FileInput>
                </div>
                <div className="smd-load_modal-actions">
                    <Button onClick={this.close}>{t('commonButtons.close')}</Button>
                    <Button className='btn btn-primary' onClick={this.loadContent}>{t('loadModal.load')}</Button>
                </div>
            </Modal.Footer>
        </Modal>);
      }
}

const mapStateToProps = state => {
      return {
          isVliwLoadContentModalOpen: state.Ui.isVliwLoadContentModalOpen,
      }
  }
  
function mapDispatchToProps(dispatch) {
      return { actions: bindActionCreators({toggleVliwLoadContentModal}, dispatch)};
} 

export default connect(mapStateToProps, mapDispatchToProps)(VLIWLoadContentModalComponent);
