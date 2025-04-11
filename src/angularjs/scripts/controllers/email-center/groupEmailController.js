angular.module('POOLAGENCY').controller('groupEmailController', function($rootScope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    // Group emails start     
    $scope.selectionsMade = [];            
    $scope.addToSelections = function(data, type) {  
        let selectionId = data.id;
        let selectionLabel = '';
        selectionLabel = `<b>`+data.label+`</b>`;
        selectionLabel = data.labelSuffix ? `<span>`+data.labelSuffix+` : </span>` + selectionLabel : selectionLabel;               
        selectionLabel = data.labelPrefix && data.labelPrefix != ' ' ? selectionLabel + ` <span>(`+data.labelPrefix+`)</span>` : selectionLabel;               
        let alreadyExists = $scope.selectionsMade.some(selection => selection.selectionId === selectionId);
        if (!alreadyExists) {   
            let selectionItem = {
                uid: $scope.generateSelectionId(),
                selectionType: type,
                selectionId: selectionId,
                selectionLabel: selectionLabel,
            }
            if (type=='routes') {
                selectionItem.date = data.date
            }  
            $scope.selectionsMade.push(selectionItem);
            $scope.selectionsMadeChanged();
            return true;
        } else {            
            let alreadyExistSelectionTag = $scope.selectionsMade.find(smtag => smtag.selectionId === selectionId);
            alreadyExistSelectionTag.alreadyExist = true;
            $timeout(function() {
                alreadyExistSelectionTag.alreadyExist = false;
            }, 100);
            return false;
        }  
    }
    $scope.removeFromSelections = function(uid) {
        if (uid == 'all' && $scope.selectionsMade.length > 0) {
            $scope.selectionsMade = [];
            $scope.selectionsMadeChanged();
        } else {            
            const indexToDelete = $scope.selectionsMade.findIndex(selection => selection.uid === uid);
            if (indexToDelete !== -1) {
                $scope.selectionsMade.splice(indexToDelete, 1);
                $scope.selectionsMadeChanged();
                return true;
            } else {
                return false;
            }
        }
    }    
    $scope.convertedStatusNames = {
        "Active_noroute" : "ACTIVE (no route)",
        "Active_routed" : "ACTIVE (routed)",
        "Inactive" : "INACTIVE",
        "Lead" : "LEAD"
    } 
    $scope.getStatusName = {};
    $scope.isFilterMasterLoading = {};    
    $scope.equipments = []; 
    $scope.customerStatuses = [];
    $scope.zipCodesMaster = []; 
    $scope.citiesMaster = []; 
    $scope.tagsMaster = []; 
    $scope.isMasterFilterFetched = {};
    $scope.getFilterMasterForEmails = function(type) {
        if ($scope.isMasterFilterFetched[type]) {
            return
        }
        let session = auth.getSession();
        let companyId = session.companyId;
        $scope.equipments = []; 
        $scope.isFilterMasterLoading[type] = true;   
        apiGateWay.get("/get_email_filter_data", {
            companyId: companyId,
            type: type
        }).then(function(response) {
            if (response.data.status == 200) {   
                let resData = response.data.data; 
                $scope.isMasterFilterFetched[type] = true;
                $scope.parseMasterFilterData(resData, type)                
            }
            $scope.isFilterMasterLoading[type] = false;
        }, function(error) {
            $scope.isFilterMasterLoading[type] = false;            
        });
    }
    $scope.isEmailTemplatesLoading = true;
    $scope.templateContentData = []; 
    $scope.companyLogoURL = null;
    $scope.emailVariables = [];
    $scope.emailVariablesDefaultValues = [];
    $scope.getEmailTemplates = function(selectedEmailTemplateId=0) {        
        $scope.templateContentData = []; 
        $scope.isEmailTemplatesLoading = true;   
        apiGateWay.get("/template_list").then(function(response) {
            if (response.data.status == 200) {                                  
                let emailTemplates = response.data.data.data ? response.data.data.data : []; 
                if (emailTemplates && emailTemplates.length > 0) {
                    emailTemplates = $scope.sortAlphabetically(emailTemplates);
                }
                $scope.companyLogoURL = response.data.data.companyLogo ? response.data.data.companyLogo : null;  
                $scope.selectedEmailTemplate = $scope.noneEmailTemplate();
                let templateTypesToIgnore = ["Invoice","One off job","Route","Quotes","routeReminderPerm","routeReminderOne","pastDueInvoiceReminder","openQuotesReminder"];
                emailTemplates.forEach(function(template){
                    if (!templateTypesToIgnore.includes(template.templateType)) {
                        $scope.templateContentData.push({
                            templateId: template.templateId,
                            templateName: template.templateName,
                            body: (template.body && $scope.companyLogoURL && $scope.companyLogoURL != '') ? template.body.replaceAll('{{COMPANY_LOGO}}',$scope.companyLogoURL) : '',
                            subject: template.subject,
                            isSystem: template.isSystem
                        })
                    }                    
                  })  
                let emailVariables = response.data.data.emailVaribles ? response.data.data.emailVaribles : [];   
                $scope.emailVariables = emailVariables.filter(variable => variable.package && variable.package != '' && variable.package.includes('Default'));                       
                $scope.emailVariablesDefaultValues = emailVariables.filter(item => item.defaultData !== undefined);                
                $scope.initFroalaForEmailCenter(emailVariables);
                         
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
    $scope.froalaOptionsEmailCenter = null;     
    $scope.initFroalaForEmailCenter = function(emailVariables) {
        getFroalaConfig.get().then(function(data){           
          $scope.froalaOptionsEmailCenter = angular.copy(data);
          $scope.froalaOptionsEmailCenter.height = 500;          
          $timeout(function(){
            if (emailVariables && emailVariables.length > 0) {
              let _options = {}
              emailVariables.forEach(function(item){  
                let package = [];
                if (item.package && item.package != '') {
                    package = item.package.split(',');
                }
                if (package.includes('Default')) _options[item.id] = item.title
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
                  if ($scope.froalaOptionsEmailCenter.froalaEditor) {
                    if (val == 'COMPANY_LOGO' && $scope.companyLogoURL) {
                        let img = `<img  style="display:block;margin:0 auto;width: 200px" src="`+$scope.companyLogoURL+`"/>`;
                        $scope.froalaOptionsEmailCenter.froalaEditor.html.insert(img)
                    } else {
                      $scope.froalaOptionsEmailCenter.froalaEditor.html.insert('{{'+val+'}}')
                    }
                    $scope.froalaOptionsEmailCenter.froalaEditor.undo.saveStep();
                  }
                },        
                refresh: function ($btn) {},        
                refreshOnShow: function ($btn, $dropdown) {}
              });
            } 
          })
        }); 
    }
    $scope.replaceText = function(emailVar) {
        var input = document.getElementById("templateSubject");
        var replacementOption = emailVar.id;
        var cursorPos = input.selectionStart;
        if (input.selectionStart === input.selectionEnd) {    
          input.value = input.value.substring(0, cursorPos) + '{{'+replacementOption+'}}' + input.value.substring(cursorPos);
          $scope.selectedEmailTemplate.subject = input.value;
        } else {    
          var textBeforeCursor = input.value.substring(0, cursorPos);
          var textAfterCursor = input.value.substring(cursorPos);    
          var newText = textBeforeCursor + '{{'+replacementOption+'}}' + textAfterCursor;    
          input.value = newText;
          $scope.selectedEmailTemplate.subject = input.value;
          input.selectionStart = input.selectionEnd = cursorPos + replacementOption.length;
        }
      }
    $scope.filterPayloadQueryTypes = [
        { id: 'and', label: 'All'},
        { id: 'or', label: 'Any'},
    ];
    $scope.emailListData = null;
    $scope.emailListTotalEmail = null;
    $scope.emailListPage = null;
    $scope.emailListColumnName = null;
    $scope.emailListLength = null;
    $scope.emailListDir = null;
    $scope.emailListOffset = null;
    $scope.emailListTotalPage = null;
    $scope.contactType = null;
    $scope.isComposeMailWindow = null;
    $scope.isEmailListLoading = false;        
    $scope.selectedFilterPayloadQueryType = $scope.filterPayloadQueryTypes[0];
    $scope.initPayloadForGroupEmails = function(isBackFromCompose=false) {
        if (!isBackFromCompose) {      
            $scope.contactType = 'both';                  
        }
        $scope.emailListData = [];
        $scope.emailListTotalEmail = 0;
        $scope.emailListPage = 1;
        $scope.emailListColumnName = 'displayName';
        $scope.emailListDir = 'asc';
        $scope.emailListOffset = 0;
        $scope.emailListTotalPage = 0;            
        $scope.emailListLength = 15;
        $scope.isComposeMailWindow = false;        
        $scope.closeAllFilterDropdown();
        $scope.getEmails();
        $scope.getFilterMasterForEmails('all');
        $scope.getFilterMasterForEmails('city');
        $scope.fetchRoutes();        
    }
    $scope.filterPayloadQueryType = function(type) {
        $scope.selectedFilterPayloadQueryType = type;
        $scope.getEmails();
    }
    $scope.emailFilterSortingData = [
        { id:'displayName', value: 'Customer Name' },
        { id:'contactName', value: 'Contact Name' },
        { id:'isPrimary', value: 'Contact Type' },
        { id:'email', value: 'Email' }
    ]  
    $scope.selectedEmailFilterSortingTitle = 'SORT BY';      
    $scope.getEmails = function() {  
        if ($scope.selectionsMade.length == 0) {
            $scope.emailListData = [];
            $scope.emailListOffset = 0;
            $scope.emailListTotalEmail = 0;
            $scope.emailListTotalPage = 0;
            return
        }
        $scope.isEmailListLoading = true;
        let emailPayload = {
            column: $scope.emailListColumnName,
            dir: $scope.emailListDir,
            length: $scope.emailListLength,
            page: $scope.emailListOffset,            
            ...$scope.getFiltersPayLoad()            
        }        
        $scope.emailListPage =  $scope.emailListOffset + 1
        let endpoint = '/get_customer_details_data';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    r.canceller.resolve()
                    return
                }
            })
        } 
        apiGateWay.send(endpoint, emailPayload).then(function(response) {
            if (response.data.status == 200) {                    
                $scope.emailListData = response.data.data.data;
                if (emailPayload.page == 0) {
                    $scope.emailListTotalEmail = response.data.data.count;
                }
                $scope.emailListTotalPage = ($scope.emailListTotalEmail % $scope.emailListLength) !== 0 ? parseInt($scope.emailListTotalEmail / $scope.emailListLength) : parseInt(($scope.emailListTotalEmail / $scope.emailListLength)) - 1;
            } else {
                $scope.emailListData = [];
                $scope.emailListTotalEmail = 0;
                $scope.emailListTotalPage = 0;
            }
            $scope.isEmailListLoading = false;
        }, function(error) {
            $scope.isEmailListLoading = false;
            $scope.emailListData = [];
            $scope.emailListTotalEmail = 0;
            $scope.emailListTotalPage = 0;
        });
    }
    $scope.orderEmailListBy = function(column, x) {
        if(x){
            $scope.selectedEmailFilterSortingTitle = 'SORT BY: ' +  x.value;
        }
        $scope.emailListDir = ($scope.emailListDir == 'desc') ? 'asc' : 'desc';
        $scope.emailListColumnName = column;
        $scope.emailListOffset = 0;
        $scope.getEmails();
    }   
    $scope.selectionsMadeChanged= function() {
        $scope.emailListOffset = 0;
        $scope.getEmails();   
    } 
    $scope.goToPage = function(page) {
        $scope.emailListOffset = page - 1;
        $scope.getEmails();
    };
    $scope.updateContactType = function(value) {
        $scope.contactType = value;
        $scope.emailListOffset = 0;
        $scope.getEmails();   
    }    
    $scope.equipmentDropdownStatus = {};
    $scope.toggleEquipmentDropdown = function(id) {
        if($scope.equipmentDropdownStatus[id]) {
            $scope.equipmentDropdownStatus[id] = false;
            return
        }
        $scope.equipmentDropdownStatus = {};
        $scope.equipmentDropdownStatus[id] = true;
    }
    $scope.closeEquipmentDropdown = function() {        
        $scope.equipmentDropdownStatus = {};
    }
    $scope.ecpDropwDownOpen = {};
    $scope.toggleEcpDropDown = function(id) {
        if($scope.ecpDropwDownOpen[id]) {
            $scope.ecpDropwDownOpen[id] = false;
            return
        }
        $scope.ecpDropwDownOpen = {};
        $scope.ecpDropwDownOpen[id] = true;
        if (id == 'route') {
            $scope.fetchRoutes();
        }
    }    
    $scope.closeEcpDropDown = function() {
        $scope.ecpDropwDownOpen = {};
    }    
    $scope.closeAllFilterDropdown = function(){
        $scope.closeEcpDropDown();
        $scope.closeEquipmentDropdown();
    }
    $scope.openComposeMailWindow = function() {
        $scope.closeAllFilterDropdown();
        $scope.isComposeMailWindow = true;    
        $scope.setSelectedTemplate(null);     
    }  
    $scope.closeComposeMailWindow = function (form=null) {
        if (form) {
            form.$setPristine();
            form.$setUntouched();
        }
        $scope.closeAllFilterDropdown();
        $scope.initPayloadForGroupEmails(true)        
        $scope.isComposeMailWindow = false
    }
    $scope.getEmailTemplates();
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
            body: `<div style="background-color: #f6f6f6;">
                        <div style="width: 100%;background-color: #fff;max-width: 660px;margin: 0 auto;">
                        <div style="height:10px;background:#191919"></div>
                        ` + companyLogo + `
                        <div style="padding: 15px;">
                            <div style="padding: 15px;">
                                <div><span>Hi {{CONTACT_FIRST_NAME}},</span></div>
                                <span>Your message content goes here. Remove this and type whatever you want.&nbsp;</span>
                                <br>
                                <br><span><strong>Examples of what you can use Group Emails for are:</strong></span>
                                <br><span>- Send upgrade recommendations to customers who have sand filters or single speed pumps</span>
                                <br><span>- Notify everyone on a specific route that their service is delayed due to weather</span>
                                <br><span>- Send all your VIP tagged customers a special thank you message</span>
                                <br><span>- Send all your &quot;Active (routed)&quot; customers notice about vacation days or price raises</span>
                                <br><span>- Send all your &quot;Lead&quot; customers a special offer if they sign up in the next 30 days<br></span>
                                <br>
                                <div>
                                    <br>
                                </div>
                                <hr>
                                <div style="text-align: center;font-size: 12px"><span style="background-size: contain;background-image: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/png/1f4ac.png);" class="fr-emoticon fr-deletable fr-emoticon-img">&nbsp;</span> Questions? Contact {{COMPANY_NAME}} at {{COMPANY_EMAIL}} or {{COMPANY_PHONE}}</span></div>
                            </div>
                        </div>
                        <div style="width: 100%;line-height: 0;border-top: 10px solid #18b2e8;margin-top: 15px;">
                            <br>
                        </div>
                        </div>
                    </div>`
        };  
        return emailTemplate  
    }
    $scope.selectedEmailTemplate = null;
    $scope.setSelectedTemplate = function(template) {  
        if (template) {
            $scope.selectedEmailTemplate = template;            
        } else {
            $scope.selectedEmailTemplate = $scope.noneEmailTemplate();            
        }
    }
    $scope.modifyEmailTemplate = null;
    $scope.selectedEmailTemplateForModify = null;    
    $scope.openModifyEmailTemplate = function(templateForm) {   
        if (!templateForm.$valid) {
            templateForm.$submitted = true;
            return
        }       
        $scope.selectedEmailTemplateForModify = angular.copy($scope.selectedEmailTemplate)
        $scope.selectedEmailTemplateForModify.templateId = 0;
        $scope.selectedEmailTemplateForModify.templateName = $scope.generateNewTemplateName();
        $scope.modifyEmailTemplate = ngDialog.open({                        
            template: "modifyEmailTemplate.html",
            className: 'ngdialog-theme-default v-center email-center-popups',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {                
                $scope.selectedEmailTemplateForModify = null;
            }
        });
    }
    $scope.isEmailTemplatesUpdating = false;
    $scope.saveEmailTemplate = function() {                    
        let payLoad = {}
        payLoad.templateName = $scope.selectedEmailTemplateForModify.templateName;
        payLoad.subject = $scope.selectedEmailTemplateForModify.subject;
        payLoad.body = $scope.selectedEmailTemplateForModify.body;              
        $scope.isEmailTemplatesUpdating = true;            
        let apiURL = '/save_template';
        if (payLoad.body && payLoad.body != '') {
            payLoad.body = $scope.companyLogoURL && $scope.companyLogoURL != '' ? payLoad.body.replaceAll($scope.companyLogoURL, '{{COMPANY_LOGO}}') : payLoad.body;
        }
        payLoad = angular.toJson(payLoad)
        apiGateWay.send(apiURL, payLoad).then(function(response) {
            if (response.data.status == 200) {                      
                ngDialog.closeAll();                  
                $scope.getEmailTemplates(response.data.data.templateId);          
            }
            $scope.isEmailTemplatesUpdating = false;
        }, function(error) {
            $scope.templateExistErrorMsg = typeof error == 'string' ? error : 'Something went wrong'; 
            $timeout(function(){                
                $scope.templateExistErrorMsg = '';                
            }, 1000)
            $scope.isEmailTemplatesUpdating = false;            
        });
    }
    $scope.templateExistErrorMsg = '';
    $scope.sendEmailSuccess = '';
    $scope.sendEmailError = '';    
    $scope.sentPreviewEmailModel = {};
    $scope.isEmailSending = false;
    $scope.isPreviewEmailSending = false;
    $scope.sendMail = function(templateForm) {
        if (!templateForm.$valid) {
            templateForm.$submitted = true;
            return
        } 
        let subjectInput = document.getElementById('templateSubject');
        let subject = subjectInput.value ? subjectInput.value : '';
        if (subject == '') {            
            if (subjectInput) {
                subjectInput.focus();
                subjectInput.classList.add('has-error');
            }
            return
        }
        $scope.sendEmailSuccess = '';
        $scope.sendEmailError = '';                        
        let payLoad = {  
            ...$scope.getFiltersPayLoad(),          
            body: `<div style="line-height: 1.5">`+$scope.selectedEmailTemplate.body+`</div>`,
            subject: $scope.selectedEmailTemplate.subject,
            templateId: $scope.selectedEmailTemplate.templateId
        } 
        payLoad = angular.toJson(payLoad)
        $scope.isEmailSending = true;
        apiGateWay.send('/set_bulk_email', payLoad).then(function(response) {
            if (response.data.status == 200) {   
                $scope.sendEmailSuccess = 'Email sent successfully.'; 
                templateForm.$setPristine();
                templateForm.$setUntouched();
                $scope.selectedEmailTemplate = null;                
                $scope.closeComposeMailWindow();
                $timeout(function(){
                    $scope.sendEmailSuccess = '';                     
                }, 3000)             
            } else {
                $scope.sendEmailError = 'Something went wrong';
                $timeout(function(){
                    $scope.sendEmailError = '';                     
                }, 3000) 
            }   
            $scope.isEmailSending = false;      
        }, function(error) {
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            $timeout(function(){
                $scope.sendEmailError = '';                     
            }, 3000)  
            $scope.isEmailSending = false; 
        });
    }
    $scope.removeErrorClass = function(id) {
        let subjectInput = document.getElementById(id);
        if (subjectInput) {            
            subjectInput.classList.remove('has-error');
        }
    }
    $scope.sendPreview = function(templateForm){        
        if (!templateForm.$valid) {
            templateForm.$submitted = true;
            return
        }                    
        let subjectInput = document.getElementById('templateSubject');
        let subject = subjectInput.value ? subjectInput.value : '';
        if (subject == '') {            
            if (subjectInput) {
                subjectInput.focus();
                subjectInput.classList.add('has-error');
            }
            return
        }
        $scope.sendEmailSuccess = '';
        $scope.sendEmailError = '';
        $scope.sentPreviewEmailModel.email = auth.getSession().userType != 'administrator' ? auth.getSession().email : auth.getSession().companyEmail;
        ngDialog.open({
                template: 'sentEmailPopup.html',
                className: 'ngdialog-theme-default v-center email-center-popups',
                overlay: true,
                closeByNavigation: false,
                closeByDocument: false,
                scope: $scope,                
        });
    }
    $scope.sendPreviewMail  = function(sentPreviewEmailModel) {                 
        let payLoad = {  
            email: sentPreviewEmailModel.email,
            body: `<div style="line-height: 1.5">`+$scope.selectedEmailTemplate.body+`</div>`,
            subject: $scope.selectedEmailTemplate.subject,
            templateId: $scope.selectedEmailTemplate.templateId
        }                
        if (payLoad.body && payLoad.body != '') {
            payLoad.body = $scope.replaceVariablesWithTestData(payLoad.body);
        }  
        $scope.isPreviewEmailSending = true;
        apiGateWay.send('/send_preview_email', payLoad).then(function(response) {
            if (response.data.status == 200) {   
                $scope.sendEmailSuccess = 'Email preview sent successfully';   
                ngDialog.closeAll();
                $timeout(function(){
                    $scope.sendEmailSuccess = '';                     
                }, 3000)                             
            } else {
                $scope.sendEmailError = 'Something went wrong';
                $timeout(function(){
                    $scope.sendEmailError = '';                     
                }, 3000) 
            }         
            $scope.isPreviewEmailSending = false;
        }, function(error) {
            $scope.isPreviewEmailSending = false;  
            $scope.sendEmailError = typeof error == 'string' ? error : 'Something went wrong';
            $timeout(function(){
                $scope.sendEmailError = '';                     
            }, 3000)           
        });
    }
    $scope.routeListDate = moment();
    $scope.modifyRouteListDate = function(diretion) {
        let input = document.querySelector('#searchRoute')
        if (input) {
            input.value = '';
        }
        $scope.routes = [];
        $scope.isRoutesLoading = true;
        if (diretion == 'left') {
            $scope.routeListDate = $scope.routeListDate.subtract(1, 'days');
        }
        if (diretion == 'right') {
            $scope.routeListDate = $scope.routeListDate.add(1, 'days');
        }
        $scope.fetchRoutes();
    }
    $scope.routes =[];
    $scope.routesCache =[];
    $scope.isRoutesLoading = false;   
    $scope.fetchRoutes = function() {
        const hasData = $scope.routesCache.find(item => item.date === $scope.routeListDate.format('YYYY-MM-DD'));
        if (hasData) {
            $scope.routes = hasData.routes;
            $scope.isRoutesLoading = false;
            return
        }
        $scope.isRoutesLoading = true;
        let endpoint = '/route_list';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {
                    r.canceller.resolve();
                }
            })
        }     
        clearInterval($scope.fetchRoutesInterval);
        $scope.fetchRoutesInterval = setTimeout(function(){  
            $scope.routes =[];          
            let payload = {
                date: $scope.routeListDate.format('YYYY-MM-DD')
            }
            apiGateWay.get(endpoint, payload).then(function(response) { 
                if (response.data.status == 200) {
                    let routes = [];
                    let routeResponse = response.data.data;
                    if (routeResponse && routeResponse.length > 0) {
                        routeResponse.forEach(function(route){
                            routes.push({
                                label: route.title,
                                id: route.id,
                                color: route.color,
                                userImage: route.userImage ? route.userImage : null,
                                techFirstname: route.techFirstname,
                                techLastname: route.techLastname,
                                technicianId: route.technicianId,
                                date: payload.date,
                                labelSuffix: 'Route'
                            })
                        })
                    }
                    $scope.routes = routes;
                    $scope.routesCache.push({
                        date: $scope.routeListDate.format('YYYY-MM-DD'),
                        routes: routes
                    })
                }
                $scope.isRoutesLoading = false;
            }, function(error) {
                $scope.isRoutesLoading = false;
            })
        }, 200)       
    }
    $scope.replaceVariablesWithTestData = function(str) {
        const updatedStr = str.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
            const item = $scope.emailVariablesDefaultValues.find(obj => obj.id === p1);
            return item ? item.defaultData : match;
        });
        return updatedStr;
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
    // Group emails ends
    //  helper functions    
    $scope.replaceCustomerStatusWithID = function(customerStatus) {
        let _customerStatus = [];
        if (customerStatus && customerStatus.length > 0) {
            customerStatus.forEach(function(status){
                _customerStatus.push($scope.customerStatusProps[status])
            })
        }        
        return _customerStatus
    }
    $scope.getSelectionsForPayLoad = function(type) {
        let _selection = [];
        if ($scope.selectionsMade && $scope.selectionsMade.length > 0) {
            $scope.selectionsMade.forEach((eq)=>{
                if (eq.selectionType==type) {
                    if (type=='routes') {
                        let payloadItem = {
                            id: eq.selectionId,
                            date: eq.date
                        }
                        _selection.push(payloadItem)
                    } else {
                        _selection.push(eq.selectionId)
                    }
                }
            })
        }
        return _selection;
    }    
    $scope.generateSelectionId = function() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return timestamp + randomStr;
    }    
    $scope.filterList = function(inputId, listId) {
        var input, filter, ul, li, a, i, txtValue;
        input = document.getElementById(inputId);
        filter = input.value.toLowerCase();
        ul = document.getElementById(listId);
        li = ul.getElementsByTagName('li');
        var found = false;
        for (i = 0; i < li.length; i++) {
            txtValue = li[i].textContent || li[i].innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                li[i].style.display = '';
                found = true;
            } else {
                li[i].style.display = 'none';
            }
        }        
        var noResults = ul.querySelector('#' + listId + ' .no-results-found-li');
        if (noResults) {
            ul.removeChild(noResults);
        }        
        if (!found && filter.length > 0) { 
            var noResults = document.createElement('li');
            let ulname = 'records';
            if (listId == 'cityList') ulname = 'city';
            if (listId == 'zipCodeList') ulname = 'zipcode';
            if (listId == 'tagList') ulname = 'tag';
            if (listId == 'routeList') ulname = 'route';
            noResults.textContent = 'No '+ulname+' found';
            noResults.classList.add('no-results-found-li'); 
            noResults.setAttribute('data-no-found-ul', ulname); 
            ul.appendChild(noResults);
        }
    }
    $scope.parseFilterData = function(data, type) {   
        let arr = [];
        let _arr = data;        
        if (_arr && _arr.length > 0){
            _arr.forEach(function(item){                       
                if (item != '' && item != undefined && item != null) {                    
                    let _obj = {
                        label: type == 'status' && $scope.getStatusName[item] ? $scope.getStatusName[item] : item,
                        id: item,
                        selectionType: type,
                        labelSuffix: $scope.getLabelSuffixName(type)
                    }
                    arr.push(_obj);
                }                               
            })
        }
        return arr;
    }    
    $scope.getLabelSuffixName = function(type) {
        let labelSuffix = '';
        if (type == 'tag') labelSuffix = 'Tag'
        if (type == 'invoiceStatus') labelSuffix = 'Invoice'
        if (type == 'invoiceStatus') labelSuffix = 'Invoice'
        return labelSuffix
    } 
    $scope.getFiltersPayLoad = function(){
        let equipmentTypeId = $scope.getSelectionsForPayLoad('equipment');            
        let zipcode = $scope.getSelectionsForPayLoad('zip');
        let city = $scope.getSelectionsForPayLoad('city');
        let customerStatus = $scope.getSelectionsForPayLoad('status');
        customerStatus = $scope.replaceCustomerStatusWithID(customerStatus)
        let invoiceStatus = $scope.getSelectionsForPayLoad('invoiceStatus');
        let tags = $scope.getSelectionsForPayLoad('tag');
        let routes = $scope.getSelectionsForPayLoad('routes');
        let primaryAddress = $scope.contactType == 'both' || $scope.contactType == 'primary' ? 1 : 0;
        let billingAddress = $scope.contactType == 'both' || $scope.contactType == 'billing' ? 1 : 0;
        let filerPayload = {
            equipmentTypeId: equipmentTypeId,
            zipcode: zipcode,
            city: city,
            customerStatus: customerStatus,
            invoiceStatus: invoiceStatus,
            tags: tags,
            routes: routes,
            primaryAddress: primaryAddress,
            billingAddress: billingAddress,
            queryMode: $scope.selectedFilterPayloadQueryType.id
        }
        return filerPayload
    }
    $scope.parseMasterFilterData = function(resData, type) {
        if (type == 'all') {
            $scope.equipments = resData.equipments ? resData.equipments : [];                
            $scope.customerStatusProps = angular.copy(resData.customerStatus)
            resData.customerStatus = Object.keys(resData.customerStatus)  
            $scope.getStatusName = {};                              
            resData.customerStatus.forEach(function(s){            
                $scope.getStatusName[s] = $scope.convertedStatusNames[s] ? $scope.convertedStatusNames[s] : s
            })
            resData.invoiceStatus = Object.keys(resData.invoiceStatus);
            $scope.customerStatuses = resData.customerStatus && resData.customerStatus.length > 0 ? $scope.parseFilterData(resData.customerStatus,'status') : [];        
            $scope.invoiceStatuses = resData.invoiceStatus && resData.invoiceStatus.length > 0 ? $scope.parseFilterData(resData.invoiceStatus,'invoiceStatus') : [];                    
            let allTags = [];
            if (resData.tags && resData.tags.length > 0) {
                let _tags = resData.tags;
                _tags.forEach(function(tag){
                    let formattedTag = tag.trim();
                    if (!allTags.some(existingTag => existingTag.toLowerCase() === formattedTag.toLowerCase())) {
                        allTags.push(formattedTag);
                    }
                });
            }
            $scope.tagsMaster = $scope.parseFilterData(allTags,'tag');
        } else if (type == 'city') {
            $scope.zipCodesMaster = resData.zipcode && resData.zipcode.length > 0 ? $scope.parseFilterData(resData.zipcode,'zip') : [];
            $scope.citiesMaster = resData.citys && resData.citys.length > 0 ? $scope.parseFilterData(resData.citys,'city') : [];
        }        
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
        let placeHolder = document.querySelector('#emailCenterFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.add('transparent-fr-placeholder')
        }
    }
    function handleBlur(event) {
        let placeHolder = document.querySelector('#emailCenterFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.remove('transparent-fr-placeholder')
        }
    }
    handleFroalaEvents('#emailCenterFroala .fr-element', 'focus', handleFocus);    
    handleFroalaEvents('#emailCenterFroala .fr-element', 'blur', handleBlur);       
    //  helper functions
})