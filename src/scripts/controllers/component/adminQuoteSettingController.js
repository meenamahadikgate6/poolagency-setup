angular.module('POOLAGENCY')
.controller('adminQuoteSettingController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, $window, auth,AwsConfigService,AwsS3Utility, configConstant) {    
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.env = configConstant[$scope.selectedEvn];    
    $scope.quoteSettingsData = {   
        id: 0,     
        isNotesRequired: 0,
        isNotifyApprovesQuote: 1,
        isNotifyDeniesQuote: 1,
        approveEmailsData: [],
        denyEmailsData: [],
        defaultNotes: '',
        quoteAutoClose: false,
        quoteAutoCloseAfter: 0
    }
    $scope.defaultNotesCache = '';
    $scope.approveEmailsDataCache = '';
    $scope.denyEmailsDataCache = '';  
    $scope.defaultNotesCache = '';
    $rootScope.settingPageLoaders.QuoteSettingSection = true;
    $scope.quoteSettingAreaDisabled = true;
    $scope.quoteSettingSuccess = '';
    $scope.quoteSettingError = '';
    $scope.showingNewEmailInputApproved = false;
    $scope.showingNewEmailInputDenied = false;
    $scope.getQuoteSettings = () => {
        $rootScope.settingPageLoaders.QuoteSettingSection = true;
        apiGateWay.get('/company/manage_quotes_settings', {}).then(function(response) {                       
            if (response.data.status == 200 && response.data.message == 'Quotes Settings not found.') {                
                $scope.generateInitialSettings();
            } else if (response.data.status == 200 && response.data.data){
                var res = response.data.data;
                $scope.quoteSettingsData.id = res.quotesSettingsData.id;
                $scope.quoteSettingsData.isNotesRequired = res.quotesSettingsData.isNotesRequired;
                $scope.quoteSettingsData.isNotifyApprovesQuote = res.quotesSettingsData.isNotifyApprovesQuote;
                $scope.quoteSettingsData.isNotifyDeniesQuote = res.quotesSettingsData.isNotifyDeniesQuote;
                $scope.quoteSettingsData.defaultNotes = res.quotesSettingsData.defaultNotes;
                $scope.defaultNotesCache = res.quotesSettingsData.defaultNotes;
                $scope.quoteSettingsData.approveEmailsData = res.approveEmailsData;   
                $scope.approveEmailsDataCache = JSON.stringify(res.approveEmailsData);             
                $scope.quoteSettingsData.denyEmailsData = res.denyEmailsData;
                $scope.denyEmailsDataCache = JSON.stringify(res.denyEmailsData);             
                $rootScope.settingPageLoaders.QuoteSettingSection = false;
                $scope.quoteSettingAreaDisabled = false;
                $scope.showingNewEmailInputApproved = false;
                $scope.showingNewEmailInputDenied = false;
                $scope.quoteSettingsData.quoteAutoClose = res.quotesSettingsData.isQuoteAutoclose || false;
                $scope.quoteSettingsData.quoteAutoCloseAfter = res.quotesSettingsData.quoteCloseDays || 0;
            }            
            $rootScope.settingPageLoaders.QuoteSettingSection = false;
            $scope.quoteSettingAreaDisabled = false;
        }, function(error) {
            $rootScope.settingPageLoaders.QuoteSettingSection = false;
            $scope.quoteSettingAreaDisabled = false;
        })
    }
    $scope.changeIsNotesRequired = () => {
        $scope.quoteSettingsData.isNotesRequired = !$scope.quoteSettingsData.isNotesRequired;
        $scope.updateQuoteSettings();  
    }
    $scope.changeIsNotifyApprovesQuote = () => {        
        $scope.quoteSettingsData.isNotifyApprovesQuote = !$scope.quoteSettingsData.isNotifyApprovesQuote;
        if (!$scope.quoteSettingsData.isNotifyApprovesQuote) {
            $scope.showingNewEmailInputApproved = false;
        }
        $scope.updateQuoteSettings();  
    }
    $scope.changeIsNotifyDeniesQuote = () => {
        $scope.quoteSettingsData.isNotifyDeniesQuote = !$scope.quoteSettingsData.isNotifyDeniesQuote;
        if (!$scope.quoteSettingsData.isNotifyDeniesQuote) {
            $scope.showingNewEmailInputDenied = false;
        }
        $scope.updateQuoteSettings();  
    }
    $scope.changeQuoteDefaultNotes = () => {        
        if ($scope.defaultNotesCache != $scope.quoteSettingsData.defaultNotes){
            $scope.updateQuoteSettings();  
        }
    }
    $scope.updateQuoteSettings = () => { 
        $rootScope.settingPageLoaders.QuoteSettingSection = true;       
        apiGateWay.send('/company/manage_quotes_settings', $scope.quoteSettingsData).then(function(response) {
            if (response.data.status == 200) {
                $scope.getQuoteSettings();        
            }
        })
    }
    $scope.addEmailAddress = (type) => {
        $scope.quoteSettingError = '';
        if (type == 'Approved') {
            $('#addApprovedEmailInput').removeClass('has-error')
            var email = $('#addApprovedEmailInput').val();
            if (email && email != '' && $scope.validateEmail(email)) {
                var duplicateEmail = false;
                if ($scope.quoteSettingsData.approveEmailsData.length > 0) {
                    $scope.quoteSettingsData.approveEmailsData.forEach(function(savedEmail){
                        if (savedEmail.email == email) {
                            duplicateEmail = true
                        }
                    })
                }
                if (duplicateEmail) {
                    $scope.quoteSettingError = 'Email already exist.'
                    $('#addApprovedEmailInput').addClass('has-error');
                    setTimeout(function(){
                        $scope.quoteSettingError = '';
                    }, 2000)
                    return 
                } else {
                    $scope.addNewEmailAddressToServer(email, type)
                }                     
            } else {
                $('#addApprovedEmailInput').addClass('has-error');
                $scope.quoteSettingError = 'Please enter email address.'
                setTimeout(function(){
                    $scope.quoteSettingError = '';
                }, 2000) 
            }
        }
        if (type == 'Denied') {
            $('#addDeniedEmailInput').removeClass('has-error')
            var email = $('#addDeniedEmailInput').val();
            if (email && email != '' && $scope.validateEmail(email)) { 
                var duplicateEmail = false;
                if ($scope.quoteSettingsData.denyEmailsData.length > 0) {
                    $scope.quoteSettingsData.denyEmailsData.forEach(function(savedEmail){
                        if (savedEmail.email == email) {
                            duplicateEmail = true
                        }
                    })
                }                      
                if (duplicateEmail) {
                    $scope.quoteSettingError = 'Email already exist.'
                    $('#addDeniedEmailInput').addClass('has-error');
                    setTimeout(function(){
                        $scope.quoteSettingError = '';
                    }, 2000)
                    return 
                } else {
                    $scope.addNewEmailAddressToServer(email, type)
                }     
            } else {
                $('#addDeniedEmailInput').addClass('has-error');
                $scope.quoteSettingError = 'Please enter email address.'
                setTimeout(function(){
                    $scope.quoteSettingError = '';
                }, 2000)
            }
        }
    }
    $scope.addNewEmailAddressToServer = (email, type) => {  
        $scope.quoteSettingAreaDisabled = true; 
        $(document).find('#add_'+type+'_email_btn').addClass('loading')
        $(document).find('#cancel_'+type+'_email_btn').addClass('disabled')        
        apiGateWay.send('/company/quotes_settings_email', { 
            quoteSettingId: $scope.quoteSettingsData.id,           
            email: email,
            type: type
        }).then(function(response) {
            if (response.data.status == 200) {
                if (type === 'Approved') {
                    $('#addApprovedEmailInput').val('')
                }
                if (type === 'Denied') {
                    $('#addDeniedEmailInput').val('')
                }
                $scope.getQuoteSettings();        
            } else {
                $scope.quoteSettingError = response.data.message ?  response.data.message : 'Something went wrong. Please try again.'
                setTimeout(function(){
                    $scope.quoteSettingError = '';
                }, 2000)
            }
            $(document).find('#add_'+type+'_email_btn').removeClass('loading')
            $(document).find('#cancel_'+type+'_email_btn').removeClass('disabled')
            $scope.quoteSettingAreaDisabled = false;            
        }, function(error){
            $(document).find('#add_'+type+'_email_btn').removeClass('loading')
            $(document).find('#cancel_'+type+'_email_btn').removeClass('disabled')
            $scope.quoteSettingAreaDisabled = false; 
            $scope.quoteSettingError = error
            setTimeout(function(){
                $scope.quoteSettingError = '';
            }, 2000)
        })
    }
    $scope.removeEmailAddress = (data, type) => {    
        $scope.removeEmailAddressFromServer(data, type)
    }
    $scope.removeEmailAddressFromServer = (data, type) => {
        $scope.quoteSettingAreaDisabled = true;        
        $(document).find('#remove_'+type+'_email_btn_' + data.id).addClass('loading')        
        apiGateWay.send('/company/delete_quotes_settings_email', { 
            quoteSettingEmailId: data.id
        }).then(function(response) {
            if (response.data.status == 200) {
                $scope.getQuoteSettings();        
            } else {
                $$scope.quoteSettingError = response.data.message ?  response.data.message : 'Something went wrong. Please try again.' 
                setTimeout(function(){
                    $scope.quoteSettingError = '';
                }, 2000)  
            }
            $(document).find('#remove_'+type+'_email_btn_' + data.id).removeClass('loading')   
            $scope.quoteSettingAreaDisabled = false;              
        }, function(error) {
            $(document).find('#remove_'+type+'_email_btn_' + data.id).removeClass('loading')
            $scope.quoteSettingAreaDisabled = false; 
            $scope.quoteSettingError = error
            setTimeout(function(){
                $scope.quoteSettingError = '';
            }, 2000)
        })        
    }
    $scope.validateEmail = (email) => {
        var isEmailValid = false;
        var emailRegex = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i;
        if (emailRegex.test(email)) {
            isEmailValid = true
        }
        return isEmailValid;
    }
    $scope.toggleNewEmailInputDenied = (type, status)  => {
        if (type === 'Approved') {
            $scope.showingNewEmailInputApproved = status;
            // $scope.showingNewEmailInputDenied = false;
            if ($scope.showingNewEmailInputApproved) {
                setTimeout(function(){
                    $('#addApprovedEmailInput').focus();
                }, 300)
            }
        }
        if (type === 'Denied') {
            $scope.showingNewEmailInputDenied = status;
            // $scope.showingNewEmailInputApproved = false;
            if ($scope.showingNewEmailInputDenied) {
                setTimeout(function(){
                    $('#addDeniedEmailInput').focus();
                }, 300)
            }
        }
    }
    $scope.generateInitialSettings = function() {
        $rootScope.settingPageLoaders.QuoteSettingSection = true;       
        $scope.quoteSettingsData.id = 0;        
        apiGateWay.send('/company/manage_quotes_settings', $scope.quoteSettingsData).then(function(response) {
            if (response.data.status == 200 && response.data.data.quotesSettingsId && $rootScope.replyToEmailQuoteSetting != '') {
                $scope.quoteSettingsData.id = response.data.data.quotesSettingsId;
                $scope.addNewEmailAddressToServer($rootScope.replyToEmailQuoteSetting, 'Approved')      
                $scope.addNewEmailAddressToServer($rootScope.replyToEmailQuoteSetting, 'Denied')      
            }
        })
    }
    
    $scope.enableEditingEmail = function(data) {
        $scope.showingNewEmailInputApproved = false;
        $scope.showingNewEmailInputDenied = false;
        $(document).find('.email-list-box input').attr('disabled', 'disabled')
        $(document).find('#qseaInp_'+ data.id).removeAttr('disabled')
    }
    $scope.updateEmail = function(data, type) {                 
        var email = data.email; 
        if (email === $scope.getOldEmail(data.id, type)) {
            return
        }
        $scope.quoteSettingError = '';
        if (email && email != '' && $scope.validateEmail(email)) {
            $scope.updateEmailAddressToServer(data, type)                 
        } else {                                
            $(document).find('#qseaInp_'+ data.id).addClass('has-error');
            $(document).find('#qseaInp_'+ data.id).blur();
            $scope.quoteSettingError = 'Please enter a valid email address.'
            setTimeout(function(){
                $scope.quoteSettingError = '';
            }, 2000)                             
            var oldEmail = $scope.getOldEmail(data.id, type);
            data.email = oldEmail;
        }                    
    }
    
    $scope.updateEmailAddressToServer = (data, type) => {         
        $scope.quoteSettingAreaDisabled = true;
        $(document).find('#remove_'+type+'_email_btn_' + data.id).addClass('editing').addClass('loading')            
        apiGateWay.send('/company/quotes_settings_email', { 
            quoteSettingId: $scope.quoteSettingsData.id,   
            quoteSettingEmailId: data.id,        
            email: data.email,
            type: type
        }).then(function(response) {
            if (response.data.status == 200) {                
                $scope.getQuoteSettings();        
            } else {
                $scope.quoteSettingError = response.data.message ?  response.data.message : 'Something went wrong. Please try again.'
                var oldEmail = $scope.getOldEmail(data.id, type);
                data.email = oldEmail;
                setTimeout(function(){
                    $scope.quoteSettingError = '';
                }, 2000)
            } 
            $(document).find('#remove_'+type+'_email_btn_' + data.id).removeClass('editing').removeClass('loading')           
            $scope.quoteSettingAreaDisabled = false;            
        }, function(error){
            $scope.quoteSettingAreaDisabled = false; 
            var oldEmail = $scope.getOldEmail(data.id, type);
            data.email = oldEmail;
            $(document).find('#remove_'+type+'_email_btn_' + data.id).removeClass('editing').removeClass('loading')
            $scope.quoteSettingError = error
            setTimeout(function(){
                $scope.quoteSettingError = '';
            }, 2000)
        })
    }
    $scope.getOldEmail = (id, type) => {
        var emailAddress = '';
        var approveEmailsDataCache = $scope.approveEmailsDataCache != '' ? JSON.parse($scope.approveEmailsDataCache) : [];
        var denyEmailsDataCache = $scope.denyEmailsDataCache != '' ? JSON.parse($scope.denyEmailsDataCache) : [];
        if (type === 'Approved') {
            var e = approveEmailsDataCache.find(x => x.id === id)
            emailAddress = e.email
        }
        if (type === 'Denied') {
            var e = denyEmailsDataCache.find(x => x.id === id)
            emailAddress = e.email
        }
        return emailAddress
    }    
    $scope.selectedEmailForDeletion = {
        data: '',
        type: ''
    }
    $scope.confirmDeleteEmail = (data, type) => {        
        $scope.selectedEmailForDeletion = {
            data: data,
            type: type
        }
        $scope.deleteEmailModal = ngDialog.open({
            template: 'deletEmailFromQuoteSettingsConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByDocument: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {            
                $scope.selectedEmailForDeletion = {
                    data: '',
                    type: ''
                }              
            }
        });
    }
    $scope.closeDeleteEmailModal = () => {
        $scope.deleteEmailModal.close();
    }
    $scope.confirmedEmailFromQuoteSettingsAction = () => {
        $scope.removeEmailAddress($scope.selectedEmailForDeletion.data, $scope.selectedEmailForDeletion.type)
        $scope.closeDeleteEmailModal();
    }
    $scope.focusOnEmailInp = () => {
        $(document).find('.has-error:not(.addEmailInput)').removeClass('has-error')
    }
    // Templates sections start here
    $scope.generateNewTemplateName = function() {
        let templateNames = [];
        let baseName = 'Template'
        $scope.quoteTemplates.forEach(function(template){
            templateNames.push(template.templateName)
        })
        const existingNumbers = templateNames
        .filter(name => name.toLowerCase().startsWith(baseName.toLowerCase() + ' '))
        .map(name => parseInt(name.replace(baseName, '').trim()))
        .filter(num => !isNaN(num));        
        if (!existingNumbers.includes(1)) {
            return baseName + ' 1';
        }        
        let i = 1;
        while (existingNumbers.includes(i)) {
            i++;
        }
        return baseName + ' ' + i;
    }
    $scope.getBlankQuoteTemplate = function() {
        let blankQuoteTemplate = {            
            templateName: $scope.generateNewTemplateName(),
            quotesTitle: ''            
        }
        return blankQuoteTemplate
    }
    $scope.templateSuccessMsg = '';
    $scope.templateErrorMsg = '';
    $scope.quoteTemplates = []; 
    $scope.getQuoteTemplates = function() {                  
      $scope.isQuoteTemplatesProcessing = false;
      apiGateWay.get("/quote_template_settings").then(function(response) {
          if (response.data.status == 200) {   
              $scope.quoteTemplates = [];
              let quoteTemplates = response.data.data.customTemplate ? response.data.data.customTemplate : []; 
              quoteTemplates.forEach(function(template){
                function getDiscountValue(title) {
                    let v = 0;
                    if (title.includes('%') || title.includes('$')) {
                        v = title.replace(/[^\d.]/g, '');
                        v = Number(v)
                    }
                    return v
                }
                let lineData = [];
                if (template.lineData && template.lineData.lineData) {
                    lineData = template.lineData.lineData
                }
                let data = {                       
                        "discountTitle":  template.discountTitle ? template.discountTitle : '',
                        "discountValue": getDiscountValue(template.discountTitle ? template.discountTitle : ''),
                        "id": template.id,
                        "lineData": lineData,
                        "officeNotes": template.officeNotes ? template.officeNotes : '',
                        "quoteNotes": template.quoteNotes ? template.quoteNotes : '',
                        "subTotalAmount": template.subTotalAmount,
                        "techNotes": template.techNotes ? template.techNotes : '',
                        "templateName": template.templateName,
                        "quotesTitle": template.title,
                        "totalAmount": template.totalAmount
                    }                
                    
                    $scope.quoteTemplates.push(data)
              })  
          }          
          $scope.isQuoteTemplatesProcessing = false;
      }, function(error) {
        $scope.isQuoteTemplatesProcessing = false;
      });
    }
    $scope.getQuoteTemplates();
    $scope.selectedTemplateForModification = null;
    $scope.selectedTemplateForModificationMode = null;
    $scope.quoteTemplateModal = null;
    $scope.quoteTemplateModalIsOpen = false;
    $scope.openTemplate = function(template, mode) {
        let sourceBtns = document.querySelectorAll('.modal-opener-link');
        sourceBtns.forEach(btn => {
            btn.blur();
        });
        if ($scope.quoteTemplateModalIsOpen) {
            return
        }
        $scope.selectedTemplateForModificationMode = mode;
        $scope.selectedTemplateForModification = angular.copy(template);
        $scope.editImagesCache = [];
        if (mode == 'edit') {
            $scope.editImagesCache = angular.copy($scope.selectedTemplateForModification.lineData)
        }   
        // parse template to popup
        $scope.lineitemData = (mode == 'edit' || mode == 'delete') ? template.lineData : [];
        delete $scope.selectedTemplateForModification.id;
        $scope.selectedTemplateForModification.templateId = template.id;
        $scope.quotesNotesModel.quotesNotes = template.quoteNotes;
        $scope.quotesNotesModel.officeNotes = template.officeNotes;
        $scope.quotesNotesModel.techNotes = template.techNotes;
        $scope.discountTitle = mode == 'edit' ? template.discountTitle : '';
        $scope.discountValue = mode == 'edit' ? template.discountValue : 0;      
        $scope.discountValueType = '$';
        if ($scope.discountTitle && $scope.discountTitle.includes('%')) {
            $scope.discountValueType = '%'
        }
        $scope.quoteNotesTab = 'quotes';
        // parse template to popup   
        $scope.quoteTemplateModalIsOpen = true;
        $scope.quoteTemplateModal = ngDialog.open({
            template: 'quoteTemplateModal.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: $scope.selectedTemplateForModificationMode == 'delete',
            preCloseCallback: function(type) {
                $scope.quoteTemplateModalIsOpen = false;  
                $scope.detectImageChange($scope.editImagesCache, $scope.selectedTemplateForModification.lineData)          
                $scope.deleteLineItemImages(); // delete all temp images
                $scope.getQuoteTemplates();
                $scope.turnOffTemplateNameEditing();
                $scope.turnOffAllLineItemEditing();
                $scope.lineitemData = [];
                $scope.editImagesCache = [];
                $scope.tempId = '';
                $scope.isProductSearchOn = false;
            }
        });
    }
    $scope.turnOffAllLineItemEditing = function() {
        if ($scope.lineitemData && $scope.lineitemData.length > 0) {
            $scope.lineitemData.forEach(function(lineItem){
                if (lineItem.editMode) {
                    $scope.resetValue(lineItem)
                }
            })
        }
    }
    $scope.turnOnLineItemEditing = function(item) {
        if ($scope.lineitemData && $scope.lineitemData.length > 0) {
            $scope.lineitemData.forEach(function(lineItem){
                if (lineItem.editMode) {
                    $scope.resetValue(lineItem)
                }
            })
        }
        item.editMode = true;
    }
    $scope.turnOffLineItemEditing = function(item) {
        item.editMode = false;
        $scope.cacheValue(item)    
    }    
    $scope.detectImageChange = function(oldData, newData) {        
        if (oldData && newData && oldData.length == 0 && newData.length == 0) {
            return
        } else{
            function findRemovedItems(oldData, newData) {                
                const newFileNames = newData.flatMap(obj => {
                    if (obj.photos && Array.isArray(obj.photos)) {
                        return obj.photos.map(photo => photo.fileName);
                    } else {
                        return []; // or handle the case when obj.photos is null or not an array
                    }
                });
                const removedItems = [];
                oldData.forEach(oldObj => { 
                    if (oldObj && oldObj.photos) {                
                        oldObj.photos.forEach(oldPhoto => {                        
                            if (!newFileNames.includes(oldPhoto.fileName)) {                            
                                removedItems.push(oldPhoto);
                            }
                        });
                    }
                });            
                return removedItems;
            }
            const removedItems = oldData && newData ? findRemovedItems(oldData, newData) : [];
            if (removedItems && removedItems.length > 0) {
                let items_for_delete = [];
                angular.forEach(removedItems, function(file) {                                        
                    items_for_delete.push(file.fileName)                                        
                });
                if (items_for_delete.length > 0) {
                    AwsS3Utility.deleteFiles(items_for_delete)                                       
                } 
            }
        }        
    }
    $scope.saveTemplate = function() {        
        $scope.isProductSearchOn = false;      
        $scope.turnOffAllLineItemEditing();
        if ($scope.getTotal().subTotalAmount < 0) {       
            $scope.templateErrorMsg = "The quote template total can't be less than $0.00";
            setTimeout(function() {
                $scope.templateErrorMsg  = "";
            }, 2000);
            return;
        }
        $scope.selectedTemplateForModification.lineData = $scope.lineitemData;
        $scope.selectedTemplateForModification.subTotalAmount = $scope.getTotal().subTotalAmount;
        $scope.selectedTemplateForModification.taxableSubTotal = $scope.getTotal().taxableSubTotal;        
        $scope.selectedTemplateForModification.totalAmount = $scope.getTotal().totalAmount;
        $scope.selectedTemplateForModification.quotesNotes = $scope.quotesNotesModel.quotesNotes;
        $scope.selectedTemplateForModification.officeNotes = $scope.quotesNotesModel.officeNotes;
        $scope.selectedTemplateForModification.techNotes = $scope.quotesNotesModel.techNotes;
        $scope.selectedTemplateForModification.discountTitle = $scope.discountTitle;        
        $scope.selectedTemplateForModification.discountValue = $scope.quoteTemplateDiscountValue;          
        // return
        $scope.templateSuccessMsg = '';
        $scope.templateErrorMsg = '';     
        $scope.isQuoteTemplatesProcessing = true;
        let apiURL = '/quote_templates';
        let payLoad = $scope.selectedTemplateForModification;
        // remove editMode & add name node
        if (payLoad && payLoad.lineData && payLoad.lineData.length > 0) {
            payLoad.lineData.forEach(function(item){
                item.editMode = false;
                item.name = item.title;
                if (item.bundleItemReference && item.bundleItemReference.length > 0) {
                    item.bundleItemReference.forEach(function(innerItem){
                        innerItem.name = innerItem.title;
                    })
                }
            })
        }
        // remove editMode & add name node
        if (payLoad && payLoad.templateId == 0) delete payLoad.templateId;
        if ($scope.selectedTemplateForModificationMode == 'delete') {
            payLoad = {
                templateId: payLoad.templateId,
                action: "delete"
            }
        }
        if ($scope.selectedTemplateForModificationMode != 'delete' && (payLoad.templateName == '' || payLoad.templateName == undefined || payLoad.templateName == null)) {
            $scope.isQuoteTemplatesProcessing = false;
            $scope.templateErrorMsg = 'Please enter template name';                
            $timeout(function(){                
                $scope.templateErrorMsg = '';                
            }, 1000)     
            return
        }
        apiGateWay.send(apiURL, payLoad).then(function(response) {
            if (response.data.status == 200 && response.data.data && response.data.data.templateId) { 
                let msg = '';
                if ($scope.selectedTemplateForModificationMode == 'add') {
                    msg = 'Template added successfully';
                    $scope.templateSuccessMsg = msg;
                    $scope.copyImagesToTemplate(angular.copy($scope.selectedTemplateForModification), response.data.data.templateId)   
                    return                 
                }
                if ($scope.selectedTemplateForModificationMode == 'edit') {
                    msg = 'Template updated successfully';                    
                }
                if ($scope.selectedTemplateForModificationMode == 'delete') {
                    msg = 'Template deleted successfully'
                    $scope.deleteLineItemImages(response.data.data.templateId)                    
                }
                $scope.templateSuccessMsg = msg;                                                         
                ngDialog.closeAll();                
                $scope.isQuoteTemplatesProcessing = false;              
                $timeout(function(){                
                    $scope.templateSuccessMsg = '';                
                }, 3000)       
            } else {
                $scope.templateErrorMsg = response.data.message; 
                $timeout(function(){                
                    $scope.templateErrorMsg = '';                
                }, 1000) 
                $scope.isQuoteTemplatesProcessing = false;
            }
        }, function(error) {
            $scope.templateErrorMsg = typeof error == 'string' ? error : 'Something went wrong'; 
            $timeout(function(){                
                $scope.templateErrorMsg = '';                
            }, 1000)  
            $scope.isQuoteTemplatesProcessing = false;            
        });    
    }   
    $scope.closeAfterTemplateUpdate = function() {
        $scope.getQuoteTemplates();
        ngDialog.closeAll();                
        $scope.isQuoteTemplatesProcessing = false;              
        $timeout(function(){                
            $scope.templateSuccessMsg = '';                
        }, 3000)
    }
    $scope.copyImagesToTemplate = function(template, templateId) {
        let photosToCopy = [];
        if (template.lineData && template.lineData.length > 0) {
            template.lineData.forEach(function(lineitem){
                if (lineitem.photos && lineitem.photos.length > 0) {                
                    lineitem.photos.forEach(function(item){
                        photosToCopy.push(item.fileName)
                    })
                }
            })           
        } else {
            $scope.closeAfterTemplateUpdate();
        } 
        if (photosToCopy.length) {
            var items = [];
            var items_for_delete = [];
            angular.forEach(photosToCopy, function(fileName) {
                let copySource = fileName;
                let key = fileName.replace($scope.tempId, templateId);
                items.push({
                    sourceKey: copySource,
                    destinationKey: key
                });
                items_for_delete.push(copySource)                                        
            });
            if (items.length > 0) {
                AwsS3Utility.copyFiles(items)
                .then(function(data) {
                    template.lineData.forEach(function(lineitem){
                        if (lineitem.photos && lineitem.photos.length > 0) {
                            lineitem.photos.forEach(function(file){
                                file.fileName = file.fileName.replace($scope.tempId, templateId)
                            })
                        }
                    })
                    $scope.closeAfterTemplateUpdate();                                    
                    })
            }                   
        } else {
            $scope.closeAfterTemplateUpdate();
        }
    }    
    $scope.deleteLineItemImages = function(templateId=0) {
        if (templateId == 0 && !$scope.tempId) {
            return
        }
        var oldPrefix  = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuoteTemplates + $rootScope.userSession.companyId+'/' + (templateId == 0 ? $scope.tempId : templateId) + '/';        
        AwsS3Utility.list([oldPrefix])
        .then(function(data) {
            if (data[0].Contents.length) {
                var items_for_delete = [];
                angular.forEach(data[0].Contents, function(file, cb) {
                    let copySource = file.Key;                    
                    items_for_delete.push(copySource)                                        
                });
                if (items_for_delete.length > 0) {
                    AwsS3Utility.deleteFiles(items_for_delete)                                     
                }                   
            }
        })
    }
    $scope.templateNameEditing = false;
    $scope.turnOnTemplateNameEditing = function() {
        $scope.templateNameEditing = true;
    }
    $scope.turnOffTemplateNameEditing = function() {
        $scope.templateNameEditing = false;
    }
    // Templates sections ends here    
    $scope.lineitemData = []; 
    $scope.quotesNotesModel = {
        quotesNotes: '',
        officeNotes: '',
        techNotes: ''
    }    
    $scope.awsCDNpath = '';    
    AwsConfigService.fetchAwsConfig().then(function(config) {
        $scope.awsCDNpath = config.domain;
    });
    $scope.updateTimeStamp = function(fullName, index) {            
        const fileNameParts = fullName.split('_');
        const lastPart = fileNameParts.pop();
        const timestamp = new Date().getTime() + index;
        return fileNameParts.join('_') + '_' + timestamp;
    }
    $scope.renameFileName = function(originalStr, index) {     
        var parts = originalStr.split('.');
        var extension = '.' + parts.pop();
        var base = parts.join('.');
        var filename = base.split('/').pop();        
        var renamedStr = $scope.updateTimeStamp(base, index) + extension;
        return renamedStr;
    }
    $scope.addProductToTemplate = function(data) {
        if (data.price != undefined || data.price != null) {
            data.price = Number(data.price)
            data.unitPrice =  data.price;
        }
        if($scope.selectedTemplateForModificationMode == 'add' && !$scope.tempId){
            $scope.tempId = $scope.getProductModelId();
        }
        // assign id to photos & change title
        if (data.bundleItemReference && data.bundleItemReference.length > 0) { // if bundle 
            data.photos = [];
            data.bundleItemReference.forEach(function(bundleItem){
                // change title
                bundleItem.title = bundleItem.name
                delete bundleItem.name
                // change price to unitPrice
                bundleItem.unitPrice =  Number(bundleItem.price);
                if (bundleItem.photos && bundleItem.photos.length > 0) {
                    bundleItem.photos.forEach(function(photo){
                        photo.productId = bundleItem.id;
                        data.photos.push(photo)
                    })
                }
            })            
        }
        if (data.photos && data.photos.length > 0) {
            $scope.isQuoteTemplatesProcessing = true;
            $scope.isProductSearchOn = false
            var items = [];
            data.photos.forEach(function(file, index){
                var oldPrefix  = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/' + (file.productId ? file.productId : data.id) + '/';
                var newPrefix =  $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuoteTemplates + $rootScope.userSession.companyId+'/' + ( $scope.selectedTemplateForModificationMode == 'add' ? $scope.tempId :  $scope.selectedTemplateForModification.templateId) + '/';
                let copySource = file.fileName;
                let newName = file.fileName.replace(oldPrefix, newPrefix)               
                let key = $scope.renameFileName(newName, index);
                file.updatedName = key;                
                items.push({
                    sourceKey: copySource,
                    destinationKey: key
                }) 
            })            
            if (items.length > 0) {
                AwsS3Utility.copyFiles(items)
                .then(function(resdata) {
                    data.photos.forEach(function(file){
                        file.fileName = file.updatedName;
                        delete file.updatedName;                        
                        if(file.productId) {
                            delete file.productId
                        }                    
                    })  
                    $scope.isQuoteTemplatesProcessing = false;
                    $scope.addProductToTemplateInner(data)
                })
                .catch(function(error) {
                    // 
                    $scope.isQuoteTemplatesProcessing = false;
                })
            }            
        } else {
            $scope.addProductToTemplateInner(data)
        } 
    }
    $scope.addProductToTemplateInner = function(data) {
        let product = {            
            "bundleItemReference": data.bundleItemReference,
            "category": data.category,
            "cost": Number(data.cost),
            "description": data.description,            
            "id": data.id,
            "isChargeTax": data.isChargeTax,
            "islabels": "N",
            "islabelsText": "",                        
            "photos": data.photos,
            "price": data.price,
            "qty": 1,
            "showIndividualPrice": data.showIndividualPrice,
            "sku": data.sku,
            "title": data.name,
            "unitPrice": data.unitPrice,
            "editMode": false
        }
        $scope.lineitemData.push(product)
        $scope.isProductSearchOn = false
    }
    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'quoteTemplate') {
            if (data.isClose) {
                $scope.isProductSearchOn = false                
                return
            }
            let totalCheck = 0;
            if (data.bundleItemReference && data.bundleItemReference.length > 0) {
                let total = 0;
                angular.forEach(data.bundleItemReference, function(item){
                    item.price = (typeof item.price === "number") ? item.price : parseFloat(item.price.replace(/[^0-9.-]/g, ''));
                    total += (item.qty) * (item.price);
                });
                totalCheck = $scope.getTotal().subTotalAmount + total;
            } else {
                totalCheck = $scope.getTotal().subTotalAmount + data.price;
            }
            if (totalCheck < 0) {          
                $scope.templateErrorMsg = "The quote template total can't be less than $0.00";
                setTimeout(function() {
                    $scope.templateErrorMsg  = "";
                }, 2000);
            } else {
                $scope.addProductToTemplate(data);
            }
        }
    });
    $scope.isProductSearchOn = false;
    $scope.openSearchProduct = function() {
        $scope.isProductSearchOn = true;        
    }
    $scope.removeProductFromLineItems = function (data) {
        let totalCheck = 0;
        if (data.bundleItemReference && data.bundleItemReference.length > 0) {
            let total = 0;
            angular.forEach(data.bundleItemReference, function (item) {
                item.unitPrice = (typeof item.unitPrice === "number") ? item.unitPrice : parseFloat(item.unitPrice.replace(/[^0-9.-]/g, ''))
                total += (item.qty) * (item.unitPrice);
            });
            totalCheck = total;
        } else {
            totalCheck = data.price;
        }
        if ($scope.lineitemData.length > 1) {
            totalCheck = $scope.getTotal().subTotalAmount - totalCheck;
        }
        if (totalCheck < 0) {
            $scope.templateErrorMsg = "The quote template total can't be less than $0.00";
            setTimeout(function () {
                $scope.templateErrorMsg = "";
            }, 2000);
        } else {
            $scope.lineitemData = $scope.lineitemData.filter(obj => obj.id !== data.id);
            $scope.cachedLineItems = $scope.cachedLineItems.filter(obj => obj.id !== data.id);   
        }
    }
    $scope.quoteTemplateDiscountValue = 0;    
    $scope.getTotal = function() {
        $scope.quoteTemplateDiscountValue = 0;      
        let calculations = {
            subTotalAmount: 0,
            taxableSubTotal: 0,            
            totalAmount: 0
        }
        if ($scope.lineitemData && $scope.lineitemData.length > 0) {
            $scope.lineitemData.forEach(function(item){
                if (item.category != 'Bundle') {
                    item.unitPrice = (typeof item.unitPrice === "number") ? item.unitPrice : parseFloat(item.unitPrice.replace(/[^0-9.-]/g, '')); 
                    item.price = item.unitPrice;
                    let amount = parseFloat(item.qty) * (item.price);
                    item.amount = amount;
                    item.lineItemTaxableAmount = item.isChargeTax ? amount : 0;
                    calculations.subTotalAmount = calculations.subTotalAmount + amount;                    
                    calculations.taxableSubTotal = calculations.taxableSubTotal + (item.isChargeTax ? amount : 0);                                        
                    calculations.totalAmount = calculations.subTotalAmount;
                    if ($scope.discountValue && $scope.discountValueType) {            
                        if ($scope.discountValueType == '$') {
                            $scope.quoteTemplateDiscountValue = $scope.discountValue
                        }
                        if ($scope.discountValueType == '%') {
                            $scope.quoteTemplateDiscountValue = ($scope.discountValue / 100) * calculations.totalAmount
                        }
                    }           
                    calculations.totalAmount = calculations.totalAmount - $scope.quoteTemplateDiscountValue;               
                } else if ((item.category == 'Bundle')) {
                    if (item.bundleItemReference && item.bundleItemReference.length > 0) {
                        item.unitPrice = 0;
                        item.amount = 0;
                        item.bundleItemReference.forEach(function(innerItem){
                            innerItem.price = (typeof innerItem.unitPrice === "number") ? innerItem.unitPrice : parseFloat(innerItem.unitPrice.replace(/[^0-9.-]/g, ''));;
                            let amount = parseFloat((innerItem.qty) * (innerItem.unitPrice));
                            innerItem.amount = amount;
                            innerItem.lineItemTaxableAmount = innerItem.isChargeTax ? amount : 0;
                            calculations.subTotalAmount = calculations.subTotalAmount + amount;                            
                            calculations.taxableSubTotal = calculations.taxableSubTotal + (innerItem.isChargeTax ? amount : 0);                                                        
                            calculations.totalAmount = calculations.subTotalAmount;                  
                            if ($scope.discountValue && $scope.discountValueType) {            
                                if ($scope.discountValueType == '$') {
                                    $scope.quoteTemplateDiscountValue = $scope.discountValue
                                }
                                if ($scope.discountValueType == '%') {
                                    $scope.quoteTemplateDiscountValue = ($scope.discountValue / 100) * calculations.totalAmount
                                }
                            } 
                            item.unitPrice = item.unitPrice + amount;
                            item.price = item.unitPrice;
                            item.amount = item.unitPrice;
			                item.lineItemTaxableAmount = item.isChargeTax ? item.amount : 0;
                            calculations.totalAmount = calculations.totalAmount - $scope.quoteTemplateDiscountValue;
                        })
                    }
                }             
            })
        }
        return calculations
    }  
    $scope.quoteNotesTab = 'quotes';
    $scope.openQuoteNoteTab = function(type){
        $scope.quoteNotesTab = type
    }
    $scope.labelsMaster = ['Required', 'Optional', 'Important', 'Recommended'];    
    $scope.totalOfBundleAmount = function(arr) {
        let total = 0;
        if (arr && arr.length > 0) {
            arr.forEach(function(item){
                total = total + (item.unitPrice*item.qty)
            })
        }
        return $rootScope.currencyTrimmer(total)
    }
    $scope.cachedLineItems = [];
    $scope.cacheValue = function(lineitem) {
        if ($scope.cachedLineItems && $scope.cachedLineItems.length > 0) {
            let _itemIndex = $scope.cachedLineItems.findIndex(cachedItem => cachedItem.id == lineitem.id)
            if (_itemIndex > -1) {
                $scope.cachedLineItems[_itemIndex] = angular.copy(lineitem)
            } else {
                $scope.cachedLineItems.push(angular.copy(lineitem))
            }
        } else {
            $scope.cachedLineItems.push(angular.copy(lineitem))
        }                
    }
    $scope.resetValue = function(lineitem) {
        if ($scope.cachedLineItems && $scope.cachedLineItems.length > 0) {                  
            $scope.lineitemData.forEach(function(item, index){
                if (item.id == lineitem.id) {
                    let _item = $scope.cachedLineItems.find(cachedItem => cachedItem.id == lineitem.id)
                    if (_item) {
                        _item.editMode = false;
                        $scope.lineitemData[index] = _item;                                
                    }
                }
            })
        } 
    }
    $scope.showDiscountInputBox = false;
    $scope.toggleDiscountInput = function() {
        $scope.turnOffAllLineItemEditing();
        $scope.showDiscountInputBox = !$scope.showDiscountInputBox;
    }
    $scope.discountTitle = '';   
    $scope.discountValue = 0; 
    $scope.discountValueType = ''; 
    $scope.setDiscountValue = function() {
        let discountValueInput = document.querySelector('#discountValue')
        let discountValueTypeInput = document.querySelector('#discountValueType')
        if (discountValueInput && discountValueTypeInput) {
            let value = Number(discountValueInput.value)
            let type = discountValueTypeInput.value;
            $scope.discountValue = value;
            $scope.discountValueType = type;            
            $scope.discountTitle = type == '$' ? '$' + value : value + '%';                
            $scope.showDiscountInputBox = false;
            // 
        } else {
            $scope.discountValue = 0;
        }
    }  
    $scope.removeDiscount = function() {
        $scope.turnOffAllLineItemEditing();
        $scope.discountValue = 0;
        $scope.discountValueType = '';
        $scope.discountTitle= '';
    }
    $scope.getPhotosArr = function(arr) {
        let newArr = [];
        if (arr.length > 0) {
            arr.forEach(function(item){
                if (!item.fileName.endsWith('.pdf')) {
                    newArr.push({
                        caption: item.caption,
                        fileName: item.fileName,
                        filePath: item.filePath
                    })
                }                  
            })            
            return newArr

        }
        return arr
    }
    $scope.galleryPhotos = [];
    $scope.showFullScreenImages = function(index, photosArr){  
        if (photosArr.length) {
              angular.forEach(photosArr, function(photo, index) {
                photo.fullPath = $scope.awsCDNpath + photo.fileName
            });
        }        
        $scope.galleryPhotos = photosArr;
        $(document).bind('keydown', function (e) {
            var ele = document.getElementsByClassName("full-screen-gallery");
            if(ele.length == 0) return;
            var carouselPrev = document.getElementsByClassName("carousel-prev");
            var carouselNext = document.getElementsByClassName("carousel-next");
            switch (e.key) {
                case 'ArrowLeft':
                    carouselPrev[carouselPrev.length-1].click();
                    break;
                case 'ArrowRight':
                    carouselNext[carouselNext.length-1].click();
            }
        });
        $scope.imageInitialIndex = index;
        ngDialog.open({
            template: 'picturesGallery.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                $scope.imageInitialIndex = 999;
            }
        });
    }
    $scope.showImageError = function() {
        ngDialog.open({
            template: 'showImageError.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {

            }
        });
    }
    $scope.downloadPDFfromLineItem = function(link) {
        window.location.href = link
    }
    $scope.showCaptionInput = function(i){        
        var elems = document.querySelectorAll(".quote-li-img-caption-input.show");
        [].forEach.call(elems, function(el) {
            el.classList.remove("show");
        });
        var elems2 = document.querySelectorAll(".quote-li-img-caption-link.hide");
        [].forEach.call(elems2, function(el) {
            el.classList.remove("hide");
        });
        if (document.getElementById('qouteImgInput_'+i+'_caption_input')) {
            document.getElementById('qouteImgInput_'+i+'_caption_input').classList.add('show')
            document.querySelector('#qouteImgInput_'+i+'_caption_input textarea').focus()
        }
        if (document.getElementById('qouteImgInput_'+i+'_caption_link')) {
            document.getElementById('qouteImgInput_'+i+'_caption_link').classList.add('hide')
        }
        if (document.getElementById('qouteImgInput_'+i+'_caption_edit')) {
            document.getElementById('qouteImgInput_'+i+'_caption_edit').classList.add('hide')
        }
        if (document.getElementById('qouteImgInput_'+i+'_caption_text')) {
            document.getElementById('qouteImgInput_'+i+'_caption_text').classList.add('hide')
        }
    };
    $scope.saveCaption = function(e, photo, lineitem, i) {
            var _value = e.target.value;
            lineitem.photos.filter(function(v,i) {
                if (v.fileName === photo.fileName) {
                    v.caption = _value.trim()
                }
            }); 
            var elems = document.querySelectorAll(".quote-li-img-caption-input.show");
            [].forEach.call(elems, function(el) {
                el.classList.remove("show");
            });
            var elems2 = document.querySelectorAll(".quote-li-img-caption-link.hide");
            [].forEach.call(elems2, function(el) {
                el.classList.remove("hide");
            });
            if (document.getElementById('qouteImgInput_'+i+'_caption_input')) {
                document.getElementById('qouteImgInput_'+i+'_caption_input').classList.remove('show')                
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_link')) {
                document.getElementById('qouteImgInput_'+i+'_caption_link').classList.remove('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_edit')) {
                document.getElementById('qouteImgInput_'+i+'_caption_edit').classList.remove('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_text')) {
                document.getElementById('qouteImgInput_'+i+'_caption_text').classList.remove('hide')
            }            
    }      
    $scope.getSanitizedId = function(string) {        
        const filename = string.match(/\/([^/]+)\.\w+$/)[1];        
        return filename
    }
    $scope.quoteImageProcessing = {}; 
    $scope.tempId = '';
    $scope.quoteTemplateLiImageInputChange = function(e) {
        if($scope.selectedTemplateForModificationMode == 'add' && !$scope.tempId){
            $scope.tempId = $scope.getProductModelId();
        }        
        var files = e.target.files;
        var _file = files[0];
        var _extension = _file.name.split(".");
        _extension = _extension[_extension.length - 1];
        _extension = _extension.toLowerCase();
        _allowedExtensions = ['png','jpg','jpeg','gif','pdf'];
        if(_allowedExtensions.includes(_extension)) {
            var _index = e.target.getAttribute("data-index");            
            $scope.quoteImageProcessing[_index] = true;            
            var lineitem = $scope.lineitemData[_index];
            if(!lineitem.photos){ lineitem.photos = [] }
            var newFileName = $scope.getRandomFileName(_file.name);            
            newFileName = newFileName + '.' + _extension                  
            let key = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuoteTemplates + $rootScope.userSession.companyId+'/' + ($scope.selectedTemplateForModificationMode == 'add' ? $scope.tempId : $scope.selectedTemplateForModification.templateId) + '/' + newFileName;
            let body = _file;
            AwsS3Utility.upload(key, body)
            .then(function(data) {
                // uploaded 
                lineitem.photos.push({
                    caption: _extension == 'pdf' ?  _file.name : "",
                    fileName: key,
                    filePath: ""
                });
                $scope.quoteImageProcessing[_index] = false;
                $scope.calculateBundleCostAndSave(lineitem, _index);                
            })
            .catch(function(error) {
                // error in uploading
                $scope.quoteImageProcessing[_index] = false;                
                return false;
            })
        } else {
                e.target.value = null;
                $scope.showImageError();
                return;
            } 
    }
    
    $scope.getRandomFileName = function(name='') {
        let fileName = '';
        name = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        let nameArr = name.split('.');
        let extension = nameArr.pop();
        let _name = nameArr.join('_');
        fileName = _name + '_' + new Date().getTime();
        return fileName;
    }
    $scope.getProductModelId = function() {
        var possible = '0123456789012345678901234567890123456789';
        var result = '';
        for (var i = 15; i > 0; --i) {
            result += possible[Math.floor(Math.random() * possible.length)];
        }
        return 'xtemp_' + result + new Date().getTime() + '_tempx';
    }
    $scope.lineItemSelectionForDelete = null;
    $scope.photoSelectionForDelete = null;
    $scope.deleteFromImagePopup = function(lineitem, photo) {
        $scope.lineItemSelectionForDelete = lineitem;
        $scope.photoSelectionForDelete = photo;
        $scope.deletePSImageConfirmPopup = ngDialog.open({
            template: 'deleteQuotetemplateImageConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                $scope.lineItemSelectionForDelete = null;
                $scope.photoSelectionForDelete = null;
            }
        });       
    }
    $scope.deleteLineItemImageConfirmed = function() {
        let lineitem = $scope.lineItemSelectionForDelete;
        let photo = $scope.photoSelectionForDelete;
        let indexForDelete = lineitem.photos.findIndex(file => file.fileName === photo.fileName)
        if (indexForDelete > -1) {            
            lineitem.photos.splice(indexForDelete,1)
            $scope.deletePSImageConfirmPopup.close()
        }
    }
    $scope.quoteAutoCloseToggleStatusUpdating = false;
    $scope.toggleQuoteAutoClose = function() {
        if ($scope.quoteAutoCloseToggleStatusUpdating) {
            return
        }
        let currentStatus = angular.copy($scope.quoteSettingsData.quoteAutoClose);
        $scope.quoteSettingsData.quoteAutoClose = !$scope.quoteSettingsData.quoteAutoClose;
        let payload = {
            actionType: 'isQuoteAutoclose',
            value:  { 
                'isQuoteAutoclose': currentStatus ? 0 : 1
            }
        }
        $scope.quoteAutoCloseToggleStatusUpdating = true;                
        apiGateWay.send("/auto_send_reminder", payload).then(function(response) {
            if (response.data.status == 200) {

            } else {
                $scope.quoteSettingsData.quoteAutoClose = currentStatus;
                $scope.quoteSettingError = response.data.message || 'Something went wrong';
            }
            $scope.quoteAutoCloseToggleStatusUpdating = false;
            $timeout(()=>{$scope.quoteSettingError=''},2000)
        }, function(error) {
            $scope.quoteSettingsData.quoteAutoClose = currentStatus;
            $scope.quoteSettingError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.quoteAutoCloseToggleStatusUpdating = false; 
            $timeout(()=>{$scope.quoteSettingError=''},2000)           
        });
    }
    $scope.quoteCloseAfterDaysUpdating = false;
    $scope.updateQuoteCloseAfter = function() {
        if ($scope.quoteCloseAfterDaysUpdating) {
            return
        }
        let val = $scope.quoteSettingsData.quoteAutoCloseAfter;
        if (val == '' || val == null || val == undefined || val < 1 || val > 999) {
            $scope.quoteSettingError = 'Please enter value between 1 to 999';            
            $timeout(()=>{$scope.quoteSettingError=''},2000)
            return
        }
        let payload = {
            actionType: 'quoteCloseDays',
            value:  { 
                'quoteCloseDays': $scope.quoteSettingsData.quoteAutoCloseAfter
            }
        }
        $scope.quoteCloseAfterDaysUpdating = true;                
        apiGateWay.send("/auto_send_reminder", payload).then(function(response) {
            if (response.data.status == 200) {

            } else {
               $scope.quoteSettingError = response.data.message || 'Something went wrong';
            }
            $scope.quoteCloseAfterDaysUpdating = false;
            $timeout(()=>{$scope.quoteSettingError=''},2000)
        }, function(error) {
            $scope.quoteSettingError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.quoteCloseAfterDaysUpdating = false;   
            $timeout(()=>{$scope.quoteSettingError=''},2000)         
        });
    }
});


