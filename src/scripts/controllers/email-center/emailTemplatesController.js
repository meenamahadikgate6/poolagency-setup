angular.module('POOLAGENCY').controller('emailTemplatesController', function($rootScope, $scope, apiGateWay, ngDialog, auth, $timeout, getFroalaConfig, AwsConfigService) { 
  let AwsConfig = '';
  AwsConfigService.fetchAwsConfig().then(function(config) {      
    AwsConfig = config; 
  });
 $scope.emailVariables = [];
  $scope.froalaOptionsEmailTemplates = null;  
  $scope.emailTemplateNameEditing = false; 
  $scope.getBlankEmailTemplate = function(templateType='') {
    let blankTemplate = {
      templateId: 0,
      templateName: $scope.generateNewTemplateName(),
      body: $scope.noneEmailTemplate(templateType),
      subject: '',      
    };
    if (templateType != '') {
      blankTemplate.templateType = templateType
    }
    return blankTemplate
  }
  $scope.templateSuccessMsg = '';
  $scope.templateErrorMsg = '';
  $scope.templateResetErrorMsg = '';
  $scope.emailTemplates = []; 
  $scope.companyLogoURL = null;
  $scope.emailVariables = [];
  $scope.emailVariablesDefaultValues = [];
  $scope.getEmailTemplates = function() {    
    let payLoad = {};   
    $rootScope.settingPageLoaders.emailSectionTemplatesArea = true;
    $scope.isEmailTemplatesProcessing = false;
    apiGateWay.get("/template_list", payLoad).then(function(response) {
        if (response.data.status == 200) {   
            $scope.emailTemplates = [];
            let emailTemplates = response.data.data.data ? response.data.data.data : [];  
            if (emailTemplates && emailTemplates.length > 0) {
              emailTemplates = $scope.sortAlphabetically(emailTemplates);
              emailTemplates = $scope.sortTemplatesBySystem(emailTemplates);
            }
            let emailVariables = response.data.data.emailVaribles ? response.data.data.emailVaribles : []; 
            $scope.emailVariables = emailVariables;
            $scope.emailVariablesDefaultValues = emailVariables.filter(item => item.defaultData !== undefined); 
            // $scope.initFroalaForEmailTemplates();
            $scope.companyLogoURL = response.data.data.companyLogo ? response.data.data.companyLogo : null;  
            emailTemplates.forEach(function(template){
              $scope.emailTemplates.push({
                templateId: template.templateId,
                templateName: template.templateName,
                body: (template.body && $scope.companyLogoURL && $scope.companyLogoURL != '') ? template.body.replaceAll('{{COMPANY_LOGO}}',$scope.companyLogoURL) : template.body,
                subject: template.subject,
                isSystem: template.isSystem,
                templateType: template.templateType ? template.templateType : 'Default'
              })
            })  
        }          
        $rootScope.settingPageLoaders.emailSectionTemplatesArea = false;
    }, function(error) {
      $rootScope.settingPageLoaders.emailSectionTemplatesArea = false;
    });
  }
  $scope.getEmailVars = function(template) {
    let vars = [];
    $scope.emailVariables.forEach(function(item){
      let package = [];
      if (item.package && item.package != '') {
        package = item.package.split(',');
      }
      if (package.includes('Default') || package.includes(template.templateType)) {
        vars.push(item)
      }
    })
    return vars;
  }
  $scope.initFroalaForEmailTemplates = function(template) {
    getFroalaConfig.get().then(function(data){        
      $scope.froalaOptionsEmailTemplates = angular.copy(data);
      $scope.froalaOptionsEmailTemplates.height = 640;      
      $timeout(function(){
        if ($scope.emailVariables && $scope.emailVariables.length > 0) {
          let _options = {}
          $scope.emailVariables.forEach(function(item){
            let package = [];
            if (item.package && item.package != '') {
              package = item.package.split(',');
            }
            if (package.includes('Default') || package.includes(template.templateType)) {
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
              if ($scope.froalaOptionsEmailTemplates.froalaEditor) {
                if (val == 'COMPANY_LOGO' && $scope.companyLogoURL) {
                    let img = `<img  style="display:block;margin:0 auto;width: 200px" src="`+$scope.companyLogoURL+`"/>`;
                    $scope.froalaOptionsEmailTemplates.froalaEditor.html.insert(img)
                } else if ((val == 'FEEDBACK_UP' || val == 'FEEDBACK_DOWN') && (AwsConfig && AwsConfig.publicDomain)) {
                  let image = ``;                  
                  if (val == "FEEDBACK_UP") {
                    image = AwsConfig.publicDomain + `/static/uploads/images/up.png?ver=` + $rootScope.PB_WEB_VERSION;
                  } 
                  if (val == "FEEDBACK_DOWN") {
                    image = AwsConfig.publicDomain + `/static/uploads/images/down.png?ver=` + $rootScope.PB_WEB_VERSION;
                  }
                  $scope.froalaOptionsEmailTemplates.froalaEditor.html.insert(`<a target="_blank" href="{{`+val+`}}"><img src="`+image+`" style="display: inline-block; vertical-align: bottom; margin-right: 5px; margin-left: 5px; max-width: calc(100% - 10px); text-align: center;width: 67px"/></a>`)
                } else if (val == 'WATERBODY_CONTENT') {
                  let existingHtml = $scope.froalaOptionsEmailTemplates.froalaEditor.html.get();
                  if (!existingHtml.includes('id="waterBodyData"')) {
                    $scope.froalaOptionsEmailTemplates.froalaEditor.html.insert($scope.getWaterBodyHTML())                    
                  } else {
                    var tempElement = document.createElement('div');
                    tempElement.innerHTML = existingHtml;
                    var waterBodyDataContent = tempElement.querySelector('#waterBodyData').innerHTML;
                    if (
                      waterBodyDataContent.includes('{{WATERBODY_NAME}}') || 
                      waterBodyDataContent.includes('{{CHEMICAL_READINGS}}') ||
                      waterBodyDataContent.includes('{{CHEMICAL_ADDED}}') ||
                      waterBodyDataContent.includes('{{JOB_PHOTOS}}')
                    ) {
                      let errorBox = document.getElementById('duplicateVariableError');
                      if (errorBox) {
                        errorBox.innerHTML = 'A Water Body Content Block already exists in this template. Any additional bodies of water will automatically display in the email below the existing Water Body Content Block position. You can move this position anywhere you like.';
                        errorBox.style.display = 'block';
                        errorBox.scrollIntoView();
                        setTimeout(function(){
                          errorBox.innerHTML = '';
                          errorBox.style.display = 'none';
                        }, 5000)
                      }
                    } else {
                      $scope.froalaOptionsEmailTemplates.froalaEditor.html.insert($scope.getWaterBodyHTML())
                    }
                  }
                } else {
                  $scope.froalaOptionsEmailTemplates.froalaEditor.html.insert('{{'+val+'}}')
                }
                $scope.froalaOptionsEmailTemplates.froalaEditor.undo.saveStep();
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
      $scope.selectedTemplateForModification.subject = input.value;
    } else {    
      var textBeforeCursor = input.value.substring(0, cursorPos);
      var textAfterCursor = input.value.substring(cursorPos);    
      var newText = textBeforeCursor + '{{'+replacementOption+'}}' + textAfterCursor;    
      input.value = newText;
      $scope.selectedTemplateForModification.subject = input.value;
      input.selectionStart = input.selectionEnd = cursorPos + replacementOption.length;
    }
  }
  $scope.getEmailTemplates();
  $scope.selectedTemplateForModification = null;
  $scope.selectedTemplateForModificationMode = null;
  $scope.emailTemplateModal = null;
  $scope.openTemplate = function(template, mode) {
    let sourceBtns = document.querySelectorAll('.modal-opener-link');
    sourceBtns.forEach(btn => {
        btn.blur();
    });
    $scope.initFroalaForEmailTemplates(template);
    $scope.selectedTemplateForModificationMode = mode;
    $scope.selectedTemplateForModification = angular.copy(template);   
    $scope.emailTemplateModal = ngDialog.open({
      template: 'emailTemplateModal.html',
      className: 'ngdialog-theme-default v-center email-template-parent-modal',
      scope: $scope,
      closeByDocument: $scope.selectedTemplateForModificationMode == 'delete',
      preCloseCallback: function() {
        $scope.turnOffTemplateNameEditing();
      }
    });
  }
  $scope.removeUnusedWaterBodyDiv = function(emailContent) {
    if (!emailContent.includes('id="waterBodyData"')) {
      return emailContent;             
    } else {
      var tempElement = document.createElement('div');
      tempElement.innerHTML = emailContent;
      var waterBodyDataContent = tempElement.querySelector('#waterBodyData').innerHTML;
      if (
        waterBodyDataContent.includes('{{WATERBODY_NAME}}') || 
        waterBodyDataContent.includes('{{CHEMICAL_READINGS}}') ||
        waterBodyDataContent.includes('{{CHEMICAL_ADDED}}') ||
        waterBodyDataContent.includes('{{JOB_PHOTOS}}')
      ) {
        return emailContent;
      } else {
        return emailContent.replace('id="waterBodyData"', '')
      }
    }
  }
  $scope.saveTemplate = function() {
    $scope.templateSuccessMsg = '';
    $scope.templateErrorMsg = '';     
    $scope.isEmailTemplatesProcessing = true;
    let apiURL = $scope.selectedTemplateForModificationMode == 'delete' ? '/remove_template' : '/save_template';
    let payLoad = $scope.selectedTemplateForModification;
    // 
    if (payLoad.body && payLoad.body != '') {
      payLoad.body = $scope.companyLogoURL && $scope.companyLogoURL != '' ? payLoad.body.replaceAll($scope.companyLogoURL, '{{COMPANY_LOGO}}') : payLoad.body;
      if ($scope.selectedTemplateForModification.templateType == "Route" || $scope.selectedTemplateForModification.templateType == "One off job") {
        payLoad.body = $scope.removeUnusedWaterBodyDiv(payLoad.body)
      }
    }
    if ($scope.selectedTemplateForModificationMode == 'add' || $scope.selectedTemplateForModificationMode == 'edit') {
      if (payLoad.templateName == '' || payLoad.templateName == undefined || payLoad.templateName == null) {
        $scope.templateErrorMsg = 'Please enter template name'; 
        $timeout(function(){
          $scope.templateErrorMsg = ''; 
        }, 2000)
        $scope.isEmailTemplatesProcessing = false;
        return
      }
    }
    // 
    if (payLoad && payLoad.templateId == 0) delete payLoad.templateId
    apiGateWay.send(apiURL, payLoad).then(function(response) {
        if (response.data.status == 200) { 
            let msg = '';
            if ($scope.selectedTemplateForModificationMode == 'add') {
              msg = 'Template added successfully'
            }
            if ($scope.selectedTemplateForModificationMode == 'edit') {
              msg = 'Template updated successfully'
            }
            if ($scope.selectedTemplateForModificationMode == 'delete') {
              msg = 'Template deleted successfully'
            }
            $scope.templateSuccessMsg = msg;                                         
            $scope.getEmailTemplates();
            ngDialog.closeAll();                
            $scope.isEmailTemplatesProcessing = false;              
            $timeout(function(){                
              $scope.templateSuccessMsg = '';                
            }, 3000)       
        } else {
          $scope.isEmailTemplatesProcessing = false;
        }
    }, function(error) {
        $scope.templateErrorMsg = typeof error == 'string' ? error : 'Something went wrong'; 
        $timeout(function(){                
          $scope.templateErrorMsg = '';                
        }, 1000)  
        $scope.isEmailTemplatesProcessing = false;            
    });    
  }
  $scope.generateNewTemplateName = function() {
    let templateNames = [];
    let baseName = 'Template'
    $scope.emailTemplates.forEach(function(template){
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
  $scope.turnOffTemplateNameEditing = function() {
    $scope.emailTemplateNameEditing = false
  }
  $scope.turnOnTemplateNameEditing = function() {
    $scope.emailTemplateNameEditing = true;
    $timeout(function(){
      let input = document.getElementById('templateName')
      if (input) {
        input.focus()
      }
    },100)
  }
  $scope.sentPreviewEmailModel = {};
  $scope.sentEmailPopup = null;
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
    $scope.sentEmailPopup = ngDialog.open({
            template: 'sentEmailPopup.html',
            className: 'ngdialog-theme-default v-center email-center-popups',
            overlay: true,
            closeByNavigation: false,
            closeByDocument: false,
            scope: $scope,                
    });
  }
  $scope.isPreviewEmailSending = false;  
  $scope.sendPreviewMail  = function(sentPreviewEmailModel) {                 
      let payLoad = {  
          email: sentPreviewEmailModel.email,
          body: `<div style="line-height: 1.5">`+$scope.selectedTemplateForModification.body+`</div>`,
          subject: $scope.selectedTemplateForModification.subject,
          templateId: $scope.selectedTemplateForModification.templateId
      }     
      if (payLoad.body && payLoad.body != '') {
        payLoad.body = $scope.replaceVariablesWithTestData(payLoad.body, $scope.selectedTemplateForModification);
        if ($scope.selectedTemplateForModification.templateType == "Route" || $scope.selectedTemplateForModification.templateType == "One off job") {
          payLoad.body = $scope.removeUnusedWaterBodyDiv(payLoad.body)
        }
      }             
      $scope.isPreviewEmailSending = true;     
      apiGateWay.send('/send_preview_email', payLoad).then(function(response) {
          if (response.data.status == 200) {   
              $scope.sendEmailSuccess = 'Email preview sent successfully';   
              $scope.sentEmailPopup.close();
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
  const removeObjectsById = (dataArray, idsToRemove) => {
    return dataArray.filter(item => !idsToRemove.includes(item.id));
  };
  $scope.replaceVariablesWithTestData = function(str, template) {
    let skipThisVars = [];
    let defaultVarData = angular.copy($scope.emailVariablesDefaultValues);
    if (template.templateType == "Route" || template.templateType == "One off job") {
      skipThisVars = ["WATERBODY_NAME", "JOB_PHOTOS", "CHEMICAL_READINGS", "CHEMICAL_ADDED", "WATERBODY_CONTENT", "NOTES_TO_CUSTOMER"];
      defaultVarData = removeObjectsById(defaultVarData, skipThisVars)
    }
    const updatedStr = str.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
        const item = defaultVarData.find(obj => obj.id === p1);
        return item ? item.defaultData : match;
    });
    return updatedStr;
  }
  $scope.noneEmailTemplate = function(type='') {
    let companyLogo = '';
    if ($scope.companyLogoURL && $scope.companyLogoURL != '') {
        companyLogo = `<div style="text-align: center;padding: 30px 0;"><img style="display:block;margin:0 auto;width: 200px" src="`+$scope.companyLogoURL+`" alt=""></div>`
    } else {
      companyLogo = `<div style="text-align: center;padding: 30px 0;"><img style="display:block;margin:0 auto;width: 200px" src="{{COMPANY_LOGO}}" alt=""></div>`
    }
    let emailTemplate = `<div style="background-color: #f6f6f6;">
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
                    </div>`;
                    if (type == 'pastDueInvoiceReminder') {
                      emailTemplate = `<div style="background-color: #f6f6f6;">
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
                  if (type == 'openQuotesReminder') {
                      emailTemplate = `<div style="background-color: #f6f6f6;">
                                        <div style="background-color: #ffffff;font-family: Arial,Helvetica,sans-serif;font-size: 14px;line-height: 1.5;max-width: 660px;margin: 0 auto;color: #333;">
                                            <div style="height:10px;background:#191919;">
                                              <br>
                                            </div>
                                            ` + companyLogo + `
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
  $scope.getWaterBodyHTML = function() {
    let html =``;
    html += `<div id="waterBodyData">
              <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="text-align:center;padding:2px 12px;border:1px solid #333;">
                        <span style="font-weight: bold;font-size: 22px;">{{WATERBODY_NAME}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 12px;border:1px solid #333;border-top: 0;border-bottom: 0;">
                        <div style="text-align: center">{{NOTES_TO_CUSTOMER}}</div><br>
                        {{CHEMICAL_READINGS}} <br><br>
                        {{CHEMICAL_ADDED}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #333;">{{JOB_PHOTOS}}</td>
                  </tr>
              </table>
            </div>`
    return html
  }
  $scope.resetDefaultConfirmPopup = null;
  $scope.openResetDefaultConfirmBox = function() {
    $scope.resetDefaultConfirmPopup = ngDialog.open({
      template: 'resetDefaultConfirmPopup.html',
      className: 'ngdialog-theme-default v-center email-center-popups',
      overlay: true,
      closeByNavigation: false,
      closeByDocument: false,
      scope: $scope,                
    });
  }
  $scope.resetTemplate = function(template) {
    let payLoad = {  
      id: template.templateId,
      templateType: template.templateType
    }          
    $scope.isTemplateResetting = true;     
    apiGateWay.get('/reset_default_email_template', payLoad).then(function(response) {
        if (response.data.status == 200) {   
            $scope.templateSuccessMsg = 'Template reset successfully';   
            $scope.getEmailTemplates();
            ngDialog.closeAll();
            $timeout(function(){
              $scope.templateSuccessMsg = '';                     
            }, 3000)                             
          } else {
            $scope.templateResetErrorMsg = 'Something went wrong';
            $timeout(function(){
                $scope.templateResetErrorMsg = '';                     
            }, 3000) 
        }         
        $scope.isTemplateResetting = false;
    }, function(error) {
        $scope.isTemplateResetting = false;  
        $scope.templateResetErrorMsg = typeof error == 'string' ? error : 'Something went wrong';
        $timeout(function(){
            $scope.templateResetErrorMsg = '';                     
        }, 3000)           
    });
  }
  $scope.sortTemplatesBySystem = function(templates) {
    const customOrder = [
        "Route Stop Email",
        "One Time Job Email",
        "Invoice Email",
        "Quote Email",
        "Route Day Change (one time move)",
        "Route Day Change (permanent move)"
    ];
    return templates.sort((a, b) => {
        const aIsSystem = a.isSystem === 1;
        const bIsSystem = b.isSystem === 1;
        if (aIsSystem === bIsSystem) {
            const indexA = customOrder.indexOf(a.templateName);
            const indexB = customOrder.indexOf(b.templateName);
            if (indexA > -1 && indexB > -1) {
                return indexA - indexB;
            }
            else if (indexA > -1) {
                return -1;
            }
            else if (indexB > -1) {
                return 1;
            }
            else {
                return 0;
            }
        }
        else if (aIsSystem) {
            return 1;
        }
        else {
            return -1;
        }
    });
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
  // helper
  function handleFroalaEventsTemplates(selector, eventType, handler) {        
    function checkElementExistenceTemplates() {
        const element = document.querySelector(selector);
        if (element) {                
            element.addEventListener(eventType, handler);
        } else {         
            removeEventListenerTemplates();
        }
    }
    checkElementExistenceTemplates();
    function removeEventListenerTemplates() {
        const element = document.querySelector(selector);
        if (element) {
            element.removeEventListenerTemplates(eventType, handler);
        }
    }
    const observerTemplates = new MutationObserver(checkElementExistenceTemplates);
    observerTemplates.observe(document.body, { childList: true, subtree: true });
    return function stopObserving() {
        observerTemplates.disconnect();
        removeEventListenerTemplates();
    };
  }
  function handleFocusTemplates(event) {
      let placeHolder = document.querySelector('#emailTemplatesFroala .fr-placeholder');
      if (placeHolder) {
          placeHolder.classList.add('transparent-fr-placeholder')
      }
  }
  function handleBlurTemplates(event) {
      let placeHolder = document.querySelector('#emailTemplatesFroala .fr-placeholder');
      if (placeHolder) {
          placeHolder.classList.remove('transparent-fr-placeholder')
      }
  }
  handleFroalaEventsTemplates('#emailTemplatesFroala .fr-element', 'focus', handleFocusTemplates);    
  handleFroalaEventsTemplates('#emailTemplatesFroala .fr-element', 'blur', handleBlurTemplates);   
  // helper
});
