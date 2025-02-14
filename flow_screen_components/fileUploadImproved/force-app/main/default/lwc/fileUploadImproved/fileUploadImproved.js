import { LightningElement, track, api, wire } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import getKey from '@salesforce/apex/FileUploadImprovedHelper.getKey';
import encrypt from '@salesforce/apex/FileUploadImprovedHelper.encrypt';
import createContentDocLink from '@salesforce/apex/FileUploadImprovedHelper.createContentDocLink';

export default class FileUpload extends LightningElement {
    @api recordId;
    @api label;
    @api icon;
    @api uploadedlabel;
    @api contentDocumentIds;
    @api contentVersionIds;
    @api uploadedFileNames;
    @api allowMultiple;
    @api acceptedFormats;
    @api required;
    @api requiredMessage;
    @api community;
    @track objFiles = [];
    @track docIds =[];
    @track versIds = [];
    @track fileNames = [];

    uploadedLabelToUse;
    @api
    get uploadedLabel(){
        if(this.uploadedlabel == null){
            this.uploadedLabelToUse = 'Uploaded Files:';
        }
        else{
            this.uploadedLabelToUse = this.uploadedlabel;
        }
        return this.uploadedLabelToUse;
    }

    key;
    @wire(getKey) key;

    value = '';
    @wire(encrypt,{recordId: '$recordId', encodedKey: '$key.data'})
    wiredEncryption({ data }) {
        if(this.community === true){
            this.value = data;
        }
    }

    recordIdToUse = '';
    @api
    get communityDetails(){
        if(this.community != true){
            this.recordIdToUse = this.recordId;
        }
        return this.recordIdToUse;
    }
    
    handleUploadFinished(event) {
        // Get the list of uploaded files
        const files = event.detail.files;

        var objFile;
        files.forEach(file => {
            var filetype;
            if(this.icon == null){
                filetype = getIconSpecs(file.name.split('.').pop());
            }
            else{
                filetype = this.icon;
            }
            objFile = {
                name: file.name,
                filetype: filetype,
                id: file.documentId
            };
            this.objFiles.push(objFile);
            this.docIds.push(file.documentId);
            this.versIds.push(file.contentVersionId);
            this.fileNames.push(file.name);
        });

        this.contentDocumentIds=this.docIds;
        this.contentVersionIds=this.versIds;
        this.uploadedFileNames=this.fileNames;

        if(this.community === true){
            createContentDocLink({versIds: this.versIds, encodedKey: this.key.data});
        }
        
        function getIconSpecs(docType){
            switch(docType){
                case 'csv':
                    return 'doctype:csv';
                case 'pdf':
                    return 'doctype:pdf';
                case 'pps':
                case 'ppt':
                case 'pptx':
                    return 'doctype:ppt';
                case 'xls':
                case 'xlsx':
                    return 'doctype:excel';
                case 'doc':
                case 'docx':
                    return 'doctype:word';
                case 'txt':
                    return 'doctype:txt';
                case 'png':
                case 'jpeg':
                case 'jpg':
                case 'gif':
                    return 'doctype:image';
                default:
                    return 'doctype:unknown';
            }
        }
    }
    
    deleteDocument(event){

        const recordId = event.target.dataset.recordid;
        deleteRecord(recordId);
        
        let objFiles = this.objFiles;
        let removeIndex;
        for(let i=0; i<objFiles.length; i++){
            if(recordId === objFiles[i].id){
                removeIndex = i;
            }
        }

        this.objFiles.splice(removeIndex,1);
        this.docIds.splice(removeIndex,1);
        this.versIds.splice(removeIndex,1);
        this.fileNames.splice(removeIndex,1);

        this.contentDocumentIds=this.docIds;
        this.contentVersionIds=this.versIds;
        this.uploadedFileNames=this.fileNames;

    }

    @api
    validate(){
        if(this.docIds.length === 0 && this.required === true){ 
            var errorMessage;
            if(this.requiredMessage == null){
                errorMessage = 'Upload at least one file.';
            }
            else{
                errorMessage = this.requiredMessage;
            }
            return { 
                isValid: false,
                errorMessage: errorMessage
             }; 
        } 
        else {
            return { 
                isValid: true
            };
        }
    }
}