angular.module('POOLAGENCY').controller('automaticEmailsController', function($rootScope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    $scope.sendEmailSuccess = '';
    $scope.sendEmailError = '';
    $scope.aeTabs = [
        { 
            isShown: false, 
            isGridLoading: false,
            autoSend: false, 
            key: 'routeDayChanges', 
            title: 'Route Day Changes',
            data: {                
                autoSendToggleKey: 'routesEmail',
                endPoint: '/routed_reminder',
                deleteEndPoint: '/routed_reminder',
                templateType: 'routeDayChangesReminder'
            }
        },
        { 
            isShown: false,
            isGridLoading: false,
            autoSend: false,
            key: 'pastDueInvoices',            
            title: 'Past Due Invoices',
            data: {
                autoSendToggleKey: 'PastDueEmail',
                endPoint: '/pastdue_reminder',
                deleteEndPoint: '/delete_pastdue_reminder',
                templateType: 'pastDueInvoiceReminder'
            }
        },
        { 
            isShown: false, 
            isGridLoading: false,
            autoSend: false, 
            key: 'openQuotes', 
            title: 'Open Quotes',
            data: {
                autoSendToggleKey: 'OpenQuotesEmail',
                endPoint: '/quotes_reminder',
                deleteEndPoint: '/delete_quotes_reminder',                
                templateType: 'openQuotesReminder'
            }
        },        
    ];
    $scope.getActiveAeTab = function(tabKey='') {
        return $scope.aeTabs.find(function(tab) {
            return tab.isShown;
        });
    }
    $scope.getAeTabByKey = function(tabKey='') {
        return $scope.aeTabs.find(function(tab) {
            return tab.key == tabKey;
        });
    }
    $scope.autoSendToggleStatusLoading = true;
    $scope.getAutoSendToggleStatus = function() {
        $scope.autoSendToggleStatusLoading = true;
        apiGateWay.get("/auto_send_reminder").then(function(response) {
            if (response.data.status == 200) {
                // auto toggle status
                $scope.getAeTabByKey('pastDueInvoices').autoSend = response.data.data.isPastDueEmailAutoSend || false;
                $scope.getAeTabByKey('openQuotes').autoSend = response.data.data.isOpenQuotesEmailAutoSend || false;
                $scope.getAeTabByKey('routeDayChanges').autoSend = response.data.data.routedEmailAutoSend || false;                
            }            
            $scope.autoSendToggleStatusLoading = false;
        }, function(error) {
            $scope.autoSendToggleStatusLoading = false; 
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.autoSendToggleStatusUpdating = false;       
        });
    }
    $scope.getAutoSendToggleStatus();
    $scope.autoSendToggleStatusUpdating = false;
    $scope.toggleAutoSend = function() {
        if ($scope.autoSendToggleStatusUpdating) {
            return
        }
        let currentStatus = angular.copy($scope.getActiveAeTab().autoSend);
        $scope.getActiveAeTab().autoSend = !$scope.getActiveAeTab().autoSend;
        let payload = {
            actionType: $scope.getActiveAeTab().data.autoSendToggleKey,
            value:  { 
                [$scope.getActiveAeTab().data.autoSendToggleKey]: currentStatus ? 0 : 1
            }
        }
        $scope.autoSendToggleStatusUpdating = true;                
        apiGateWay.send("/auto_send_reminder", payload).then(function(response) {
            if (response.data.status == 200) {
                if($scope.getActiveAeTab().key === "routeDayChanges" && payload.value && payload.value.routesEmail == 0) {
                    $scope.getGridData();
                }
            } else {
                $scope.getActiveAeTab().autoSend = currentStatus;                                                               
                $scope.sendEmailError = response.data.message || 'Something went wrong';
            }
            $scope.autoSendToggleStatusUpdating = false;
            $timeout(()=>{$scope.sendEmailError=''},2000)
        }, function(error) {
            $scope.getActiveAeTab().autoSend = currentStatus;
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.autoSendToggleStatusUpdating = false;  
            $timeout(()=>{$scope.sendEmailError=''},2000)          
        });
    }    
    $scope.getAeGridData = function() {
        let data = [];
        if ($scope.getActiveAeTab().key === 'pastDueInvoices') {
            data = $scope.pastDueGridData;
        }
        if ($scope.getActiveAeTab().key === 'openQuotes') {
            data = $scope.openQuotesGridData;
        }
        if ($scope.getActiveAeTab().key === 'routeDayChanges') {
            data = $scope.routeDayaChangesGridData;
        }
        return data;
    }
    $scope.aeReminderModificationModal = null;
    $scope.aeReminderModificationModalData = null;  
    $scope.cachedTemplateData = '';  
    $scope.openaeReminderModificationModal = function(tab, method, reminder = {}){
        $scope.setSelectedTemplate(reminder);
        $scope.initFroalaForAutomaticEmails();        
        let modalTitle = $scope.renderModalTitle(tab, method);
        $scope.aeReminderModificationModalData = {
            modalTitle: modalTitle,
            tab: tab,
            method: method,
            reminder: angular.copy(reminder)
        }
        if (method == 'Add') {
            $scope.setSelectedTemplate($scope.noneEmailTemplate());
            $scope.aeReminderModificationModalData.reminder.emailType = 2;
            $scope.aeReminderModificationModalData.reminder.email = $scope.companyEmail;
            $scope.aeReminderModificationModalData.reminder.scheduleTime = "01/01/2000 00:00";
            $scope.emailTypeData = [2];
        }
        if (method == 'Edit') {
            if (!$scope.aeReminderModificationModalData.reminder.email || $scope.aeReminderModificationModalData.reminder.email == '') {
                $scope.aeReminderModificationModalData.reminder.email = $scope.companyEmail;
            }
            $scope.cachedTemplateData = angular.copy($scope.aeReminderModificationModalData.reminder.emailBody)
        }
        $scope.renderEmailTypeData();
        $scope.aeReminderModificationModal = ngDialog.open({
            template: 'aeReminderModificationModal.html',
            className: 'ngdialog-theme-default v-center email-center-ae-page-modal',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {
                $scope.aeReminderModificationModalData = null;
                $scope.setSelectedTemplate($scope.noneEmailTemplate());
                $scope.emailTypeData = [2];  
                $scope.cachedTemplateData = '';      
            }
        });        
    };
    $scope.cancelModification = function() {
        $scope.aeReminderModificationModal.close();
    }
    $scope.renderModalTitle = function(tab, method) {
        let title = '';
        title += method + ' ';
        if (tab.key == 'pastDueInvoices') {
            title += 'Invoice '
        } else if (tab.key == 'openQuotes') {
            title += 'Quote '
        } else if (tab.key == 'routeDayChanges') {
            title += 'Route Day Change '
        }
        title+= 'Reminder'
        return title
    }
    $scope.emailTypeEnums = function(id) {
        id = Number(id);
        let enums = [
            {
                id: 1,
                label: 'Primary Contact'
            },
            {
                id: 2,
                label: 'Billing Contact'
            },
            {
                id: 3,
                label: 'Primary + Billing Contact'
            },
            {
                id: 4,
                label: 'Internal Email'
            }
        ];        
        return enums.find(enumObj => enumObj.id === id) || null
    }
    $scope.emailTypeData = [];    
    $scope.getCheckBoxStatus = function(id) {
        return $scope.emailTypeData.includes(id);     
    }
    $scope.toggleCheckbox = function(id, event) {        
        if (event.target.checked) {
            if (id == 4) { // if user select internal email
                $scope.emailTypeData = [];
                let inputBox = document.querySelector('#internalEmail');
                $timeout(()=>{if (inputBox) inputBox.focus() }, 100)
            } else if (id == 1 || id == 2) { // if user select primary or billing email
                const index = $scope.emailTypeData.indexOf(4);
                if (index !== -1) {
                    $scope.emailTypeData.splice(index, 1);
                }
            }
            $scope.emailTypeData.push(id)
        } else {   
            if ($scope.emailTypeData.length === 1) {
                // Prevent unchecking the last checkbox
                event.preventDefault();
                return;
            }         
            const index = $scope.emailTypeData.indexOf(id);
            if (index !== -1) {
                $scope.emailTypeData.splice(index, 1);
            }
        }
        if ($scope.emailTypeData.includes(1) && $scope.emailTypeData.includes(2)) {
            $scope.aeReminderModificationModalData.reminder.emailType = 3;
        } else if ($scope.emailTypeData.includes(1) && !$scope.emailTypeData.includes(2)) {
            $scope.aeReminderModificationModalData.reminder.emailType = 1;
        } else if (!$scope.emailTypeData.includes(1) && $scope.emailTypeData.includes(2)) {
            $scope.aeReminderModificationModalData.reminder.emailType = 2;
        } else if ($scope.emailTypeData.includes(4)) {
            $scope.aeReminderModificationModalData.reminder.emailType = 4;
        } else {
            $scope.aeReminderModificationModalData.reminder.emailType = null;
        }
    }
    $scope.renderEmailTypeData = function() {
        $scope.emailTypeData = [];
        if ($scope.aeReminderModificationModalData.method == 'Add') {
            $scope.emailTypeData = [2];
        }
        if ($scope.aeReminderModificationModalData.method == 'Edit') {
            let emailType = $scope.aeReminderModificationModalData.reminder.emailType;
            if (emailType != 3) {
                $scope.emailTypeData.push(emailType);
            } else if(emailType == 3) {
                $scope.emailTypeData = [1,2]
            }
        }
    }
    $scope.isEmailTemplatesLoading = false;
    $scope.companyLogoURL = '';
    $scope.companyEmail = '';
    $scope.templateContentData = []; 
    $scope.isTemplateLoaded = false;
    $scope.getEmailTemplatesForAutomaticMails = function({ selectedEmailTemplateId = 0, isGridCallback = false } = {}) {  
        $scope.templateContentData = []; 
        $scope.isEmailTemplatesLoading = true;   
        apiGateWay.get("/template_list").then(function(response) {
            if (response.data.status == 200) {                                  
                let emailTemplates = response.data.data.data ? response.data.data.data : []; 
                if (emailTemplates && emailTemplates.length > 0) {
                    emailTemplates = $scope.sortAlphabetically(emailTemplates);
                }
                $scope.companyLogoURL = response.data.data.companyLogo ? response.data.data.companyLogo : null;  
                $scope.companyEmail = response.data.data.companyEmail ? response.data.data.companyEmail : '';  
                $scope.templateContentData = [];  
                emailTemplates.forEach(function(template){
                    if (!template.isSystem) {
                        $scope.templateContentData.push({
                            templateId: template.templateId,
                            templateName: template.templateName,
                            body: (template.body && $scope.companyLogoURL && $scope.companyLogoURL != '') ? template.body.replaceAll('{{COMPANY_LOGO}}',$scope.companyLogoURL) : template.body,
                            subject: template.subject,
                            isSystem: template.isSystem,
                            templateType: template.templateType ? template.templateType : '',
                        })
                    }
                  })  
                let emailVariables = response.data.data.emailVaribles || [];   
                $scope.emailVariables = emailVariables;                       
                $scope.emailVariablesDefaultValues = emailVariables.filter(item => item.defaultData !== undefined);
                $scope.isTemplateLoaded = true;
                if (isGridCallback) {
                    $scope.getGridData();
                }
            }
            let selectedEmailTemplate = $scope.noneEmailTemplate();            
            if (selectedEmailTemplateId !== 0) {
                selectedEmailTemplate = $scope.templateContentData.find(item => item.templateId == selectedEmailTemplateId);
            }
            $scope.setSelectedTemplate(selectedEmailTemplate)
            $scope.isEmailTemplatesLoading = false;
        }, function(error) {
            $scope.isEmailTemplatesLoading = false;            
        });
    }  
    $scope.setSelectedTemplate = function(template, byDropdown = false) {  
        if (template) {
            $scope.selectedEmailTemplate = template;            
        } else {
            $scope.selectedEmailTemplate = $scope.noneEmailTemplate();            
        }
        //  
        if ($scope.aeReminderModificationModalData) {
            $scope.aeReminderModificationModalData.reminder.subject = $scope.selectedEmailTemplate.subject;
            $scope.aeReminderModificationModalData.reminder.emailBody = $scope.selectedEmailTemplate.body;
        }        
        if ($scope.saveTemplateAndReminder && !byDropdown) {
            $scope.saveTemplateAndReminderForm.payload.templateId = template.templateId;
            $scope.modifyReminderAPI($scope.saveTemplateAndReminderForm)
        }
        // 
    }    
    $scope.noneEmailTemplate = function() {
        let companyLogo = '';
        if ($scope.companyLogoURL && $scope.companyLogoURL != '') {
            companyLogo = `<div style="text-align: center;padding: 30px 0;"><img style="display:block;margin:0 auto;width: 200px" src="`+$scope.companyLogoURL+`" alt=""></div>`
        } else {
            companyLogo = `<div style="text-align: center;padding: 30px 0;"><img style="display:block;margin:0 auto;width: 200px" src="{{COMPANY_LOGO}}" alt=""></div>`
        }
        let emailTemplate = { 
            templateId: 0, 
            templateName: 'None', 
            subject: '', 
            body: ''
        };  
        if ($scope.getActiveAeTab().key == 'pastDueInvoices') {
            emailTemplate.body = `<div style="background-color: #f6f6f6;">
                                        <div style="background-color: #ffffff;font-family: Arial,Helvetica,sans-serif;font-size: 14px;line-height: 1.5;max-width: 660px;margin: 0 auto;color: #333;">
                                            <div style="height:10px;background:#191919;">
                                              <br>
                                            </div>
                                            ` + companyLogo + `
                                            <br>
                                            <div style="padding: 0 60px;">
                                              <p><strong>{{CONTACT_FIRST_NAME}},</strong></p>
                                              <br>
                                              <p>We wanted to quickly let you know that invoice # {{INVOICE_NUMBER}} now has a past due balance owed of {{INVOICE_BALANCE_DUE}}.
                                                  <br>
                                                  <br>You can click below to view and pay the invoice. Thank You in advance and we appreciate your business! :)
                                              </p>
                                              <br>
                                              <p style="text-align:center;margin: 20px 0;"><span style="text-decoration: none;background: #1673de;color: #fff;padding: 15px;border-radius: 50px;min-width: 240px;display: inline-block;font-weight: 600;font-size: 20px;line-height: 1;">&nbsp;<a target="_blank" href="{{INVOICE_URL}}" style="text-decoration: none;background: #1673de;color: #fff;display: inline-block;font-weight: 600;font-size: 20px;line-height: 1;">View Invoice</a>&nbsp;</span></p>
                                              <br>
                                              <hr>
                                              <p style="font-size: 11px;text-align: center;"><span style="background-size: contain;background-image: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/png/1f4ac.png);" class="fr-emoticon fr-deletable fr-emoticon-img">&nbsp;</span> Questions? Contact {{COMPANY_NAME}} at {{COMPANY_EMAIL}} or {{COMPANY_PHONE}}</p>
                                              <br>
                                            </div>
                                            <div style="height:10px;background:#18b2e8;">
                                              <br>
                                            </div>
                                        </div>
                                      </div>
            `
        }
        if ($scope.getActiveAeTab().key == 'openQuotes') {
            emailTemplate.body = `<div style="background-color: #f6f6f6;">
                                        <div style="background-color: #ffffff;font-family: Arial,Helvetica,sans-serif;font-size: 14px;line-height: 1.5;max-width: 660px;margin: 0 auto;color: #333;">
                                            <div style="height:10px;background:#191919;">
                                              <br>
                                            </div>
                                            ` + companyLogo + `
                                            <br>
                                            <br>
                                            <div style="padding: 0 60px;">
                                              <p><strong>{{CONTACT_FIRST_NAME}},</strong></p>
                                              <br>
                                              <p>You have an open quote that still needs approval. Please keep in mind that many quotes in the pool industry are time sensitive to prevent algae growth and other negative affects on your equipment or water.
                                                  <br>
                                                  <br>You can click below to view the quote, approve or deny the quote, or ask us a question. You can also contact us at one of the methods listed below. We&#39;re here to help!
                                              </p>
                                              <br>
                                              <p style="text-align:center;margin: 20px 0;"><span style="text-decoration: none;background: #1673de;color: #fff;padding: 15px;border-radius: 50px;min-width: 240px;display: inline-block;font-weight: 600;font-size: 20px;line-height: 1;">&nbsp;<a target="_blank" href="{{QUOTE_URL}}" style="text-decoration: none;background: #1673de;color: #fff;display: inline-block;font-weight: 600;font-size: 20px;line-height: 1;">View Quote</a>&nbsp;</span></p>
                                              <br>
                                              <hr>
                                              <p style="font-size: 11px;text-align: center;"><span style="background-size: contain;background-image: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/png/1f4ac.png);" class="fr-emoticon fr-deletable fr-emoticon-img">&nbsp;</span> Questions? Contact {{COMPANY_NAME}} at {{COMPANY_EMAIL}} or {{COMPANY_PHONE}}</p>
                                              <br>
                                            </div>
                                            <div style="height:10px;background:#18b2e8;">
                                              <br>
                                            </div>
                                        </div>
                                      </div>
            `
        }
        return emailTemplate  
    }
    $scope.froalaOptionsAutomaticEmails = null;
    $scope.getEmailVars = function(templateType) {
        let vars = [];
        if ($scope.emailVariables && $scope.emailVariables.length > 0) {
            $scope.emailVariables.forEach(function(item){
                let package = [];
                if (item.package && item.package != '') {
                    package = item.package.split(',');
                }            
                if (package.includes('Default') || package.includes(templateType)) {
                    vars.push(item)
                }
            })
        }        
        return vars;
    }    
    $scope.replaceText = function(emailVar) {
        var input = document.getElementById("templateSubject");
        var replacementOption = emailVar.id;
        var cursorPos = input.selectionStart;
        if (input.selectionStart === input.selectionEnd) {    
            input.value = input.value.substring(0, cursorPos) + '{{'+replacementOption+'}}' + input.value.substring(cursorPos);
            $scope.aeReminderModificationModalData.reminder.subject = input.value;
        } else {    
            var textBeforeCursor = input.value.substring(0, cursorPos);
            var textAfterCursor = input.value.substring(cursorPos);    
            var newText = textBeforeCursor + '{{'+replacementOption+'}}' + textAfterCursor;    
            input.value = newText;
            $scope.aeReminderModificationModalData.reminder.subject = input.value;
            input.selectionStart = input.selectionEnd = cursorPos + replacementOption.length;
        }
    } 
    $scope.initFroalaForAutomaticEmails = function() {
        getFroalaConfig.get().then(function(data){  
          $scope.froalaOptionsAutomaticEmails = angular.copy(data);
          $scope.froalaOptionsAutomaticEmails.height = 500;          
          $timeout(function(){
            if ($scope.emailVariables && $scope.emailVariables.length > 0) {
              let _options = {}
              $scope.emailVariables.forEach(function(item){                
                let templateType = $scope.getActiveAeTab().data.templateType;
                let package = [];
                if (item.package && item.package != '') {
                    package = item.package.split(',');
                } 
                if (package.includes('Default') || package.includes(templateType)) {
                    _options[item.id] = item.title
                }
              })              
              FroalaEditor.DefineIcon('insert_email_variables', {NAME: 'Dynamic Content', template: 'text'});    
              FroalaEditor.RegisterCommand('insert_email_variables', {
                title: 'Dynamic Content',
                type: 'dropdown',
                focus: false,
                undo: false,
                refreshAfterCallback: true,
                options: _options,
                callback: function (cmd, val) {
                  if ($scope.froalaOptionsAutomaticEmails.froalaEditor) {
                    if (val == 'COMPANY_LOGO' && $scope.companyLogoURL) {
                        let img = `<img  style="display:block;margin:0 auto;width: 200px" src="`+$scope.companyLogoURL+`"/>`;
                        $scope.froalaOptionsAutomaticEmails.froalaEditor.html.insert(img)
                    } else {
                      $scope.froalaOptionsAutomaticEmails.froalaEditor.html.insert('{{'+val+'}}')
                    }
                    $scope.froalaOptionsAutomaticEmails.froalaEditor.undo.saveStep();
                  }
                },        
                refresh: function ($btn) {},        
                refreshOnShow: function ($btn, $dropdown) {}
              });
            } 
          })
        }); 
    } 
    $scope.initFroalaForAutomaticEmails();
    $scope.pastDueGridData = [];    
    $scope.openQuotesGridData = [];    
    $scope.routeDayaChangesGridData = [];    
    $scope.getGridData = function() {
        let tab = $scope.getActiveAeTab();
        tab.isGridLoading = true;
        if (!$scope.isTemplateLoaded) {
            $scope.getEmailTemplatesForAutomaticMails({ isGridCallback: true });
            return
        }
        if (tab.key == 'pastDueInvoices') { 
            $scope.pastDueGridData = [];          
            tab.data.totalCount = 0;
            tab.data.totalPage = 0;
        }
        if (tab.key == 'openQuotes') { 
            $scope.openQuotesGridData = [];
            tab.data.totalCount = 0;             
            tab.data.totalPage = 0;
        }
        if (tab.key == 'routeDayChanges') { 
            $scope.routeDayaChangesGridData = [];                       
            tab.data.totalCount = 0;             
            tab.data.totalPage = 0;
        }                 
        apiGateWay.get(tab.data.endPoint).then(function(response) {
            if (response.data.status == 200) {
                // past due invoices
                if (tab.key == 'pastDueInvoices') {                   
                    let responseData = response.data.data || [];                    
                    $scope.pastDueGridData = $scope.parseReminderData(responseData.data, tab.key);
                }                                                       
                // open quotes
                if (tab.key == 'openQuotes') {
                    let responseData = response.data.data || [];                
                    $scope.openQuotesGridData = $scope.parseReminderData(responseData.data, tab.key);
                }                                                                       
                // route day changes
                if (tab.key == 'routeDayChanges') {  
                    let responseData = response.data.data || [];                  
                    $scope.routeDayaChangesGridData = $scope.parseReminderData(responseData, tab.key);
                }                                                         
            } else {
                $scope.sendEmailError = response.data.message || 'Something went wrong';
            }
            tab.isGridLoading = false;
            $timeout(()=>{$scope.sendEmailError=''},2000)
        }, function(error) {
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            tab.isGridLoading = false; 
            $timeout(()=>{$scope.sendEmailError=''},2000)           
        });
    }
    $scope.parseReminderData = function(data, key) {
        if (data && data.length > 0) {
            data.forEach(function(reminder){                
                let timeHHMM = reminder.scheduleTime || "00:00";
                let hours = Number(timeHHMM.split(':')[0]);
                let mins = Number(timeHHMM.split(':')[1]);
                let ampm = 'AM';
                if (hours > 12) {
                    ampm = 'PM';
                }
                reminder.scheduleTime = '01/01/2000 ' + (hours < 10 ? '0' + hours : hours) + ':' + (mins < 10 ? '0' + mins : mins);
                reminder.emailBody = ($scope.companyLogoURL && $scope.companyLogoURL != '') ? reminder.emailBody.replaceAll('{{COMPANY_LOGO}}',$scope.companyLogoURL) : reminder.emailBody;
            })
        }   
        return data;       
    }
    $scope.routeReminderDurationPicker = {format: 'hh:mm A', showClear: false};
    $scope.reminderUpdating = false;
    $scope.reminderModifyError = '';
    $scope.modifyReminder = function(reminderForm) {
        let reminderData = $scope.aeReminderModificationModalData;
        let actionType = reminderData.method;
        $scope.reminderModifyError = '';
        if ($scope.reminderUpdating) {
            return
        }
        if (actionType != 'Delete' && !reminderForm.$valid) {
            reminderForm.$submitted = true;
            return
        } 
        let endpoint = reminderData.tab.data.endPoint;     
        let payload = {
            actionType: actionType,
            emailType: reminderData.reminder.emailType,
            email: null,            
            subject: reminderData.reminder.subject,
            emailBody: reminderData.reminder.emailBody,
            templateId: $scope.selectedEmailTemplate && $scope.selectedEmailTemplate.templateId ? $scope.selectedEmailTemplate.templateId : 0,  
            templateName: $scope.selectedEmailTemplate.templateName          
        }
        let scheduleTime = reminderData.reminder.scheduleTime;
        let scheduleTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        payload.scheduleTime = moment(scheduleTime).format('HH:mm');
        if (!scheduleTimeRegex.test(payload.scheduleTime)) {
            $scope.reminderModifyError = 'Please select schedule time';
            $timeout(()=>{$scope.reminderModifyError=''},2000) 
            return
        }
        if ($scope.getActiveAeTab().key == 'pastDueInvoices' || $scope.getActiveAeTab().key == 'openQuotes') {
            let scheduleDays = reminderData.reminder.scheduleDays;
            payload.scheduleDays = scheduleDays ? Number(scheduleDays) : 0;
            if (payload.scheduleDays < 1) {
                $scope.reminderModifyError = 'Please enter valid schedule days';
                $timeout(()=>{$scope.reminderModifyError=''},2000) 
                return
            }
        }
        if (payload.emailType == 4) {
            payload.email = reminderData.reminder.email;
            if (!payload.email || payload.email == null || payload.email == '') {
                return
            }
        }
        if (actionType == 'Edit') {
            payload.reminderId = reminderData.reminder.id;
        }
        if (actionType == 'Delete') {
            endpoint = reminderData.tab.data.deleteEndPoint;
            let deleteReminderPayload = {};
            deleteReminderPayload.id = reminderData.reminder.id;
            payload = deleteReminderPayload;
        }
        if (payload.emailBody && payload.emailBody != '') {
            payload.emailBody = $scope.companyLogoURL && $scope.companyLogoURL != '' ? payload.emailBody.replaceAll($scope.companyLogoURL, '{{COMPANY_LOGO}}') : payload.emailBody;
        }        
        $scope.saveTemplateAndReminder = false;     
        if (actionType == 'Add' || actionType == 'Edit') {
            if (!payload.templateId || payload.templateId == 0) {
                $scope.saveTemplateAndReminder = true;
                $scope.saveTemplateAndReminderForm = angular.copy({endpoint, payload});
                $scope.openModifyAutomatedEmailTemplate(reminderForm);                
                return
            }            
            if (actionType == 'Edit') {                
                let oldData = angular.copy($scope.cachedTemplateData)
                let newData = angular.copy(payload.emailBody)
                oldData = oldData ? oldData.replaceAll(' outline: none;', '') : oldData;
                newData = newData ? newData.replaceAll(' outline: none;', '') : newData;
                if (oldData != newData) {
                    $scope.saveTemplateAndReminderForm = angular.copy({endpoint, payload});
                    $scope.openConfirmTemplateOverwriteModal();
                    return
                }
            }
        }  
        let payLoadData = {
            endpoint: endpoint, 
            payload: payload
        }        
        $scope.modifyReminderAPI(payLoadData);
    }
    $scope.openConfirmTemplateOverwriteModal = function() {
        $scope.confirmTemplateOverwriteModal = ngDialog.open({
            template: 'confirmTemplateOverwriteModal.html',
            className: 'ngdialog-theme-default v-center email-center-ae-page-modal',
            scope: $scope,
            closeByDocument: true,
            preCloseCallback: function() {
                $scope.routeReminderForSendNow = null;        
            }
        });
    }
    $scope.confirmTemplateOverwrite = function() {        
        $scope.modifyReminderAPI($scope.saveTemplateAndReminderForm);
        $scope.confirmTemplateOverwriteModal.close();
        $scope.saveTemplateAndReminderForm = null;
    }
    $scope.modifyReminderAPI = function(payLoadData) {
        $scope.saveTemplateAndReminder = false;
        $scope.reminderUpdating = true;                
        apiGateWay.send(payLoadData.endpoint, payLoadData.payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.aeReminderModificationModal.close();
                $scope.getGridData();
            } else {
               $scope.reminderModifyError = response.data.message || 'Something went wrong';
            }
            $scope.reminderUpdating = false;
            $timeout(()=>{$scope.reminderModifyError=''},2000)
        }, function(error) {
            $scope.reminderModifyError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.reminderUpdating = false;   
            $timeout(()=>{$scope.reminderModifyError=''},2000)         
        });
    }
    $scope.routeReminderForSendNow = null;
    $scope.routeReminderForSendNowModal = null;
    $scope.sendNowRouteReminderConfirmation = function(reminder) {        
        $scope.routeReminderForSendNow = angular.copy(reminder);
        $scope.routeReminderForSendNowModal = ngDialog.open({
            template: 'aeRouteReminderSendNowConfirmation.html',
            className: 'ngdialog-theme-default v-center email-center-ae-page-modal',
            scope: $scope,
            closeByDocument: true,
            preCloseCallback: function() {
                $scope.routeReminderForSendNow = null;        
            }
        });
    }
    $scope.routeReminderSending = {};
    $scope.sendNowRouteReminder = function() {                
        let payload = angular.copy($scope.routeReminderForSendNow);
        $scope.routeReminderSending[payload.id] = true;
        $scope.routeReminderForSendNowModal.close();
        apiGateWay.send('/route_reminder_send_now', payload).then(function(response) {
            if (response.data.status == 200) {                
                $scope.getGridData();
            } else {
               $scope.sendEmailError = response.data.message || 'Something went wrong';
            }
            $scope.routeReminderSending[payload.id] = false;
            $timeout(()=>{$scope.sendEmailError=''},2000)
        }, function(error) {
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            $scope.routeReminderSending[payload.id] = false;
            $timeout(()=>{$scope.sendEmailError=''},2000)         
        });
    }
    $scope.templateExistErrorMsg = '';
    $scope.modifyAutomatedEmailTemplate = null;
    $scope.selectedAutomatedEmailTemplateForModify = null;    
    $scope.templateBodyError = false;  
    $scope.saveTemplateAndReminder = false;  
    $scope.saveTemplateAndReminderForm = null;  
    $scope.openModifyAutomatedEmailTemplate = function(reminderForm) {         
        $scope.templateBodyError = false;
        if (reminderForm.templateBody.$error.required) {
            $scope.templateBodyError = true;
            $timeout(()=>{$scope.templateBodyError=false},2000) 
            return
        }
        $scope.selectedAutomatedEmailTemplateForModify = angular.copy($scope.aeReminderModificationModalData.reminder)
        $scope.selectedAutomatedEmailTemplateForModify.templateId = 0;
        $scope.selectedAutomatedEmailTemplateForModify.templateName = $scope.generateNewTemplateName();
        $scope.modifyAutomatedEmailTemplate = ngDialog.open({                        
            template: "modifyAutomatedEmailTemplate.html",
            className: 'ngdialog-theme-default v-center email-center-popups',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {                
                $scope.selectedAutomatedEmailTemplateForModify = null;                
            }
        });
    }
    $scope.isAutomatedEmailTemplatesUpdating = false;
    $scope.saveAutomatedEmailTemplate = function() {           
        let payLoad = {}
        payLoad.templateName = $scope.selectedAutomatedEmailTemplateForModify.templateName;
        payLoad.subject = $scope.selectedAutomatedEmailTemplateForModify.subject;
        payLoad.body = $scope.selectedAutomatedEmailTemplateForModify.emailBody;
        payLoad.templateType = $scope.getActiveAeTab().data.templateType;
        $scope.isAutomatedEmailTemplatesUpdating = true;            
        let apiURL = '/save_template';
        if (payLoad.body && payLoad.body != '') {
            payLoad.body = $scope.companyLogoURL && $scope.companyLogoURL != '' ? payLoad.body.replaceAll($scope.companyLogoURL, '{{COMPANY_LOGO}}') : payLoad.body;
        }
        apiGateWay.send(apiURL, payLoad).then(function(response) {
            if (response.data.status == 200) {   
                $scope.modifyAutomatedEmailTemplate.close();   
                $scope.getEmailTemplatesForAutomaticMails({ selectedEmailTemplateId: response.data.data.templateId}); 
            }
            $scope.isAutomatedEmailTemplatesUpdating = false;
        }, function(error) {
            $scope.templateExistErrorMsg = typeof error == 'string' ? error : 'Something went wrong'; 
            $timeout(function(){                
                $scope.templateExistErrorMsg = '';                
            }, 1000)
            $scope.isAutomatedEmailTemplatesUpdating = false;            
        });
    }
    $scope.movedPropertiesPopup = null;
    $scope.movedPropertiesLoading = false;
    $scope.movedProperties = [];
    $scope.selectedRemoinderForFetchProperties = null;     
    $scope.openMovedProperties = function(reminder) {   
        $scope.movedProperties = [];   
        $scope.fetchMovedPropertiesOffset = 0;
        $scope.isMorePropertiesAvailable = true;  
        $scope.selectedRemoinderForFetchProperties = reminder; 
        $scope.isAttemptedToRemoveFromList = false;    
        $scope.fetchMovedProperties();
        $scope.movedPropertiesPopup = ngDialog.open({                        
            template: "openMovedProperties.html",
            className: 'ngdialog-theme-default v-center email-center-ae-page-modal',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {                
                $scope.selectedRemoinderForFetchProperties = null;     
                $scope.movedPropertiesLoading = false;  
                $scope.movedProperties = [];   
                $scope.fetchMovedPropertiesOffset = 0;
                $scope.isMorePropertiesAvailable = true;
                if ($scope.isAttemptedToRemoveFromList) {
                    $scope.getGridData();
                }           
            }
        });
    }
    $scope.fetchMovedPropertiesOffset = 0;
    $scope.fetchMovedPropertiesLimit = 25;
    $scope.isMorePropertiesAvailable = true;
    $scope.fetchMovedProperties = function() {
        let payLoad = {
            moveType: $scope.selectedRemoinderForFetchProperties.moveType,
            length: $scope.fetchMovedPropertiesLimit,
            page: $scope.fetchMovedPropertiesOffset
        }
        $scope.movedPropertiesLoading = true;
        apiGateWay.get('/reminder_moved_property_list', payLoad).then(function(response) {            
            if (response.data.status == 200) {
                let responseData = response.data.data.data || [];  
                // let totalProperties = response.data.data.count || 0;
                if (responseData.length > 0) {
                    responseData.forEach(function(property){                        
                        $scope.movedProperties.push(property)
                    });
                }
                // else {
                //     $scope.isMorePropertiesAvailable = false;
                // }   
                // if ((($scope.fetchMovedPropertiesOffset + 1) * $scope.fetchMovedPropertiesLimit) > totalProperties) {
                //     $scope.isMorePropertiesAvailable = false;
                // }
            }            
            $scope.movedPropertiesLoading = false;
        }, function(error) {            
            $scope.movedPropertiesLoading = false;
        });
    }
    $scope.loadMore = function() {
        // if ($scope.isMorePropertiesAvailable && !$scope.movedPropertiesLoading) {
        //     $scope.fetchMovedPropertiesOffset++;
        //     $scope.fetchMovedProperties();
        // }
    }
    $scope.removeAllPropertiesConfirmationPopup = null;    
    $scope.openRemoveAllPropertiesConfirmation = function() {        
        $scope.removeAllPropertiesConfirmationPopup = ngDialog.open({                        
            template: "removeAllPropertiesConfirmation.html",
            className: 'ngdialog-theme-default v-center email-center-ae-page-modal',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {                
                $scope.removeAllPropertiesConfirmationPopup = null;
            }
        });
    }
    $scope.isAttemptedToRemoveFromList = false;
    $scope.isRemovingAll = false;
    $scope.removePropertyFromSendList = function(isRemoveAll=false, property) {
        $scope.isRemoveAllError = '';
        $scope.isAttemptedToRemoveFromList = true;        
        let payLoad = {           
            moveType: $scope.selectedRemoinderForFetchProperties.moveType
        }
        if (property) {
            property.isDeleting = true;
            payLoad.addressId = property.addressId;
        } else if (isRemoveAll) {
            $scope.isRemovingAll = true;
            payLoad.isRemoveAll = true;
        }
        apiGateWay.get('/remove_property_from_moved_property_list', payLoad).then(function(response) {            
            if (response.data.status == 200) {
                if (property) {
                    property.isDeleting = false;
                    property.msgDeleteSuccess = true; 
                    $timeout(function(){                    
                        let index = $scope.movedProperties.indexOf(property);            
                        if (index > -1) {
                            $scope.movedProperties.splice(index, 1);
                        }
                        if($scope.movedProperties.length == 0) {
                            $scope.movedPropertiesPopup.close();
                        } 
                    }, 500)
                } else if (isRemoveAll) {
                    $scope.isRemovingAll = false;
                    ngDialog.closeAll()
                }             
            } else {
                if (property) {
                    property.isDeleting = false; 
                    property.msgDeleteError = true; 
                    $timeout(function(){                    
                        property.msgDeleteError = false; 
                    }, 1000)
                } else if (isRemoveAll) {
                    $scope.isRemovingAll = false;
                    $scope.isRemoveAllError = response.data.message ? response.data.message : 'Something went wrong';
                    $timeout(function(){
                        $scope.isRemoveAllError = '';
                    }, 2000)
                }               
            }         
        }, function(error) { 
            if (property) {
                property.isDeleting = false;
                property.msgDeleteError = true;           
                $timeout(function(){                    
                    property.msgDeleteError = false; 
                }, 1000)
            } else if (isRemoveAll) {
                $scope.isRemovingAll = false;
                $scope.isRemoveAllError = typeof error == 'string' ? error : 'Something went wrong';
                $timeout(function(){
                    $scope.isRemoveAllError = '';
                }, 2000)
            }           
        });
    }
    $scope.generateNewTemplateName = function() {
        let templateNames = [];
        let baseName = 'Template'
        $scope.templateContentData.forEach(function(template){
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
    $scope.getAMPMTime = function(time) {
        return moment(time).format('hh:mm A')
    }
    $scope.sortAlphabetically = function(templates) {
        return templates.sort((a, b) => {
            const nameA = a.templateName.toLowerCase();
            const nameB = b.templateName.toLowerCase();    
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    }
    $scope.setCurrentAeTab = function(targetTab) {
        $scope.aeTabs.forEach(function(tab) {
            tab.data.currentPage = 1;
            tab.data.offSet = 0;
            tab.data.totalCount = 0;
            tab.data.totalPage = 0;
            tab.isShown = (tab.key === targetTab.key);
        });
        $scope.getGridData();
    }    
    $scope.setCurrentAeTab($scope.aeTabs[0]);
    // handle froala
    function handleFroalaEvents(selector, eventType, handler) {        
        function checkElementExistence() {
            const element = document.querySelector(selector);
            if (element) {                
                element.addEventListener(eventType, handler);
            } else {         
                removeEventListener();
            }
        }
        checkElementExistence();
        function removeEventListener() {
            const element = document.querySelector(selector);
            if (element) {
                element.removeEventListener(eventType, handler);
            }
        }
        const observer = new MutationObserver(checkElementExistence);
        observer.observe(document.body, { childList: true, subtree: true });
        return function stopObserving() {
            observer.disconnect();
            removeEventListener();
        };
    }
    function handleFocus(event) {
        let placeHolder = document.querySelector('#automaticEmailsFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.add('transparent-fr-placeholder')
        }
    }
    function handleBlur(event) {
        let placeHolder = document.querySelector('#automaticEmailsFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.remove('transparent-fr-placeholder')
        }
    }
    handleFroalaEvents('#automaticEmailsFroala .fr-element', 'focus', handleFocus);    
    handleFroalaEvents('#automaticEmailsFroala .fr-element', 'blur', handleBlur);       
    //  helper functions
})