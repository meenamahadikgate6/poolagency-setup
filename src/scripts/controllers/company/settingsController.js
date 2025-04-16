angular.module('POOLAGENCY')

.controller('companySettingsController',
  function($scope, $state, $rootScope, $filter, $sce, $http, apiGateWay, service, ngDialog,Analytics, $timeout, $window, auth, configConstant, pendingRequests, getFroalaConfig, BroadcastService) {
    //to get chemical setting data
    $scope.permission = auth.getSession();
    $scope.companyId = $scope.permission.companyId;
    $scope.isSuperAdmin = ($scope.permission.isSuperAdmin == 1 || $scope.permission.superAdmin == 1) ? true : false;
    $scope.froalaOptionsEmailSetting = null; 
    getFroalaConfig.get().then(function(data){        
        $scope.froalaOptionsEmailSetting = angular.copy(data);           
    })
    var editorContent = '<p>For your review, here are details and pictures of our most recent cleaning visit. Thank you.</p>';
    $scope.responseData = '';
    $scope.myCroppedImage = '';
    $scope.cropperType= "rectangle";
    $scope.cpModel = {domain: ''};
    $scope.settingData = {
      replyTo : '',
      subject : "Your pool has been cleaned - thank you!",
      emailContent : '',
      companyLogo : ''
    };
    $scope.includeEmail =  {
      includeChemicalReading: 1,
      includeChemicalAdded: 1
     };
    $scope.subDomainExist = false;
    $scope.bundleSearchForm = false;
    $scope.showManualGenerationButtons = false;
    let currEnv = configConstant.currEnvironment;
    if (currEnv === 'test') {
      let isSuperAdmin = $rootScope.userSession.isSuperAdmin ? $rootScope.userSession.isSuperAdmin : 0;
      if (isSuperAdmin == 0) {
        $scope.showManualGenerationButtons = true;
      }
    }
    if (currEnv === 'prd') {
      if ($scope.companyId == 40 || $scope.companyId == 61) {
        $scope.showManualGenerationButtons = true;
      }
    }
    $scope.$on("$destroy", function () {
      $scope.chemicalReadingSettingModel = [];
      $scope.clearInterval()
    })
    //make input file clicked
    $scope.browseImage = function() {
      document.getElementById('compLogo').value = '';
      document.getElementById("compLogo").click();
    };
    $scope.imgdata = [];

    $scope.uploadFile = function($event) {
      $scope.errorLogo = "";
      $scope.successLogo = "";
      $scope.isLogoChange = false;
      var imageData = $scope.compLogo;
      setTimeout(function () {
        if (imageData === undefined) {
          var _compLogoHTML = document.getElementById('logoImgDataHTML');
          if(_compLogoHTML) {
            var _json = _compLogoHTML.innerHTML;
            if (_json && _json != '') {
              imageData = JSON.parse(_json)
            }
          }
        }
        if(imageData.filename){
          if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
            $scope.myimage = "data:image/png;base64," + imageData.base64;
            $scope.isLogoChange = true;
            ngDialog.open({
              template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
              className: 'ngdialog-theme-default',
              closeByDocument: false,
              scope: $scope,
              preCloseCallback: function (data) {
                  if (data != 'close') {
                      $scope.myimage = $scope.settingData.companyLogo = data;
                  }else{
                      $scope.myimage ="";
                  }
              }
          });
          }else{
            $scope.submitFrom = 'logo';
            $scope.errorLogo = "Please select image format in JPEG, PNG and GIF.";
            $scope.settingData.companyLogo = "";
            $scope.myimage="";
            $scope.isLogoChange = false;
            $scope.compLogo = '';
            setTimeout(function() { $scope.errorLogo = ''},5000)
          }
        }
      }, 100)
    };



    $scope.saveCompanySetting = function(submitFrom){
        $scope.submitFrom = submitFrom || 'emailsetting'       
        $scope.isProcessing = true;
        if ($scope.submitFrom == 'logo') {
          $rootScope.settingPageLoaders.logoSection = true;          
        }
        if ($scope.submitFrom == 'emailsetting') {
          $rootScope.settingPageLoaders.emailSectionTemplate = true;
        }
        var formData = $scope.settingData
        $scope.isProcessing = true;
        $scope.settingData["logoFile"] = $scope.settingData.companyLogo;
        apiGateWay.send("/company/save_logo", $scope.settingData).then(function(response) {
          if (response.data.status == 200) {
              var responseData = response.data
              $scope.successLogo = response.data.message;
              $scope.isLogoChange = false;
              if(!$scope.settingData.subject){
                $scope.settingData.subject = "Your pool has been cleaned - thank you!";
              }
              if(!$scope.settingData.emailContent){
                //$scope.$digest();
                editorContent = responseData.data.emailContent;
                $timeout(function () {
                  $scope.$apply(function () {
                    $scope.settingData.emailContent = editorContent;
                  });
                }, 0);
              }
              if(!$scope.settingData.subject){
                  $scope.settingData.subject = responseData.data.subject;
              }

          }else{
              $scope.errorLogo = response.data.message;
          }
          $scope.isProcessing = false;
          resetMessage();
          $rootScope.settingPageLoaders.emailSectionTemplate = false;   
          $rootScope.settingPageLoaders.logoSection = false;   
        }, function(error) {
          $rootScope.settingPageLoaders.emailSectionTemplate = false;                    
          $rootScope.settingPageLoaders.logoSection = false;   
          resetMessage();
          $scope.errorLogo = error;
          $scope.isProcessing = false;
          resetMessage();
        });

    }

    $scope.saveCustomerPortalSetting = function() {
      $scope.closeModal();
      $scope.isProcessing = true;
      let domain = $scope.cpModel.domain;
      apiGateWay.send("/company/save_domain", {"domain":domain}).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : "";
            if (responseData.status == 200) {
                $scope.successCustomerPortal = message;
                $scope.subDomainExist = true;
               $scope.isProcessing = false;

            } else {
              $scope.errorCustomerPortal = message;
              $scope.isProcessing = false;
            }
            resetMessage();
          },
          function(errorResponse) {
           $scope.errorCustomerPortal = errorResponse;
           $scope.isProcessing = false;
           resetMessage();
          }
        );
    };
    $scope.subDomainUpdateConfirm = function() {
        ngDialog.open({
          template: 'subDomainUpdateConfirm.html',
          className: 'ngdialog-theme-default',
          scope: $scope,
      });
    };


    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    $scope.checkEmail = function(replyTo){
      if(replyTo){
          return re.test(String(replyTo).toLowerCase());
      }else{
        return true;
      }
    }


    $scope.updateReplyTo = function(){
        $rootScope.settingPageLoaders.emailSection = true;
        $scope.submitFrom = 'emailsetting';
        if($scope.checkEmail($scope.settingData.replyTo)){
            apiGateWay.send("/company/save_logo", {replyTo : $scope.settingData.replyTo ? $scope.settingData.replyTo : ''}).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successEmailMessage = response.data.message;
                    $scope.replyToEmail = response.data.data.replyTo;
                    if(!$scope.settingData.replyTo){
                      $scope.settingData.replyTo = response.data.data.replyTo
                    }
                }else{
                    $scope.errorEmailMessage= response.data.message;
                }
                $scope.isProcessing = false;
                $rootScope.settingPageLoaders.emailSection = false;
                resetMessage();
            }, function(error) {
                $scope.ReplyTo = error;
                $scope.isProcessing = false;
                $rootScope.settingPageLoaders.emailSection = false;
                resetMessage();
            });
        }
    }
    $scope.sendFromEmailUpdating = false;
    $scope.domainErrorMsg = '';
    $scope.updateReplyFrom = function(){
      var emailInputBox = document.querySelectorAll('#replyFrom')[0];
      if (emailInputBox) { emailInputBox.classList.remove('domain-error') }
      $scope.domainErrorMsg = '';
      $scope.sendFromEmailUpdating = true;
      $scope.submitFrom = 'emailsetting';
      if($scope.checkEmail($scope.settingData.replyFrom)){
          let email = $scope.settingData.replyFrom ? $scope.settingData.replyFrom : 'notify@poolbrain.com';
          if (email && email != 'notify@poolbrain.com' && email.includes('@')) {
            let emailArr = email.split('@');
            let domain = emailArr[1];
            if (domain == 'poolbrain.com') {
              if (emailInputBox) { emailInputBox.classList.add('domain-error') }
              $scope.domainErrorMsg = 'You can only use emails from a domain you own since you have to be able to alter the DNS records for this feature to work. (poolbrain.com) is an email service and not a website/domain name you own ';
              return
            }
          }
          apiGateWay.send("/set_ses_identity", {emailId : email}).then(function(response) {
              if (response.data.status == 200) {                
                  if (response.data.message != 'DATA_NOT_FOUND') {
                    if (response.data.data && response.data.data.domain && response.data.data.domain != '') {
                      if (emailInputBox) { emailInputBox.classList.add('domain-error') }
                      $scope.domainErrorMsg = response.data.data.msg;
                    } else {                     
                      $scope.successEmailMessage = response.data.message;
                      getEmailFrom();
                    }
                  } else {
                    getEmailFrom();
                  }
              }else{
                  $scope.errorEmailMessage = response.data.message;
              }
              $scope.isProcessing = false;
              resetMessage();
          }, function(error) {
              $scope.replyFrom = error;
              $scope.isProcessing = false;
              $scope.sendFromEmailUpdating = false;
              resetMessage();
          });
      }
  }

    $scope.editorReady = function(){
        $timeout(function () {
          $scope.$apply(function () {
            $scope.settingData.emailContent = editorContent;
          });
        }, 1000);
    }


    $scope.userCanImportSB = false;
    $scope.responseData = {};
    $scope.customChemicals = [];
    $scope.checkListArray = [];
    $rootScope.chemicalsDecimalAllowedData = {};
    //$scope.isQuickBookConnect = false;
    $scope.getCompanySettings = function() {
        $scope.isProcessing = true;
        getsettingCompany();
        getEmailFrom();
        $rootScope.chemicalsDecimalAllowedData = {};
        apiGateWay.get("/chemicals_master").then(function(response) {
            if (response.data.status == 200) {
                var responseData = response.data;
                var chemData = responseData.data;
                if (chemData && chemData.length > 0) {
                  $rootScope.chemicalsDecimalAllowedData = {};
                  chemData.forEach(function(value) {
                    $rootScope.chemicalsDecimalAllowedData[value.key+'_decimalAllowed'] = Number(value.stepSize) === 0.1
                  })
                }
                parseChemicalMasterData(responseData);
                setTimeout(() => {
                  $scope.updateTabScroll();
                },1000);
                getSwimWaitMessages();
            }
        }, function(error) {
            $scope.isProcessing = false;
        });
    };

    var getSwimWaitMessages = function(){
      $scope.isProcessing = true;
      $rootScope.settingPageLoaders.chemicalSettingSection = true;
      apiGateWay.get("/save_swim_wait",{ companyId: $scope.companyId}).then(function(response) {
        if(response.status == 200) {
          $scope.isProcessing = false;
          $rootScope.swimWaitNotes = response.data.data.data.swimWait;
        }
        $rootScope.settingPageLoaders.chemicalSettingSection = false;
      }, function (error) {
        $rootScope.settingPageLoaders.chemicalSettingSection = false;
        $scope.isProcessing = false;
      });
    }

    $scope.changeSwimWaitNotes = function (swimWaitNotes) {
      $scope.isProcessing = true;
      $rootScope.settingPageLoaders.chemicalSettingSection = true;
      apiGateWay.send("/save_swim_wait", { companyId: $scope.companyId, msg: swimWaitNotes }).then(function (response) {
        if (response.status == 200) {
          $scope.isProcessing = false;
        }
        $rootScope.settingPageLoaders.chemicalSettingSection = false;
      }, function (error) {
        $rootScope.settingPageLoaders.chemicalSettingSection = false;
        $scope.isProcessing = false;
      });
    }

    var parseChemicalMasterData = function(responseData){
          $scope.chemicalOption = {
            chlorine: [],
            ph: []
          };
          $scope.chemicalValues = {
            chlorine: [],
            ph: []
          };
          $scope.combineChemical = [];
          angular.forEach(responseData.data, function(element, key){
                  if(element['key'] == 'chlorine' && element['selectedChemicalForClorine']){
                      element['selectedChemicalForClorine']['inputType'] = 'select';
                      $scope.chemicalValues.chlorine = element.selectedChemicalForClorine
                      element['selectedChemicalForClorine']['parent'] = element.key
                      $scope.combineChemical.push(element['selectedChemicalForClorine']);

                  }else if(element['key'] == 'ph' && element['selectedChemicalForPH']){
                      $scope.chemicalValues.ph = element.selectedChemicalForPH
                      element['selectedChemicalForPH']['parent'] = element.key
                      element['selectedChemicalForPH']['inputType'] = 'select';
                      $scope.combineChemical.push(element['selectedChemicalForPH']);
                  }

                  angular.forEach(element.raiseLowerChemical, function(ele, index){
                    ele['parent'] = element.key;
                    if(element.key == 'chlorine' && element.raiseLowerChemical.length >0){
                      if(ele['type'] == 'Raise'){
                          $scope.chemicalOption.chlorine.push(ele);
                      }else if(ele['type'] == 'Lower'){
                          $scope.combineChemical.push(ele)
                      }
                    }else if(element.key == 'ph' && element.raiseLowerChemical.length >0){
                          if(ele['type'] == 'Lower'){
                            $scope.chemicalOption.ph.push(ele);
                          }else if(ele['type'] == 'Raise'){
                            $scope.combineChemical.push(ele)
                          }
                    }else if(ele['chemicalKey']=='tabs'){
                        if(ele['type'] == 'Raise'){
                            $scope.combineChemical.push(ele)
                        }
                    }else{
                        $scope.combineChemical.push(ele)
                    }
                  });
          });

          $scope.combineOrderedChemical = {};
          $scope.customChemicals = {};
          angular.forEach($scope.combineChemical, function(element, key){
              if(element.parent=='tds'  || element.parentUnit=='custom'){
                  $scope.customChemicals[element['orderBy']] = element;
              }else{
                  $scope.combineOrderedChemical[element['orderBy']] = element;
              }
          });
          $scope.combineOrderedChemical = Object.values($scope.combineOrderedChemical);
          $scope.customChemicals = Object.values($scope.customChemicals);
          if (!$scope.$$phase){$scope.$apply();}
    }
    $scope.selectedServiceLevel = 0;
    $scope.dnsRecordsData = [];
    $scope.verifyingDNSChanges = false;
    var DNSVerificationEndTime = 0;
    var DNSVerificationStartTime = 0;
    $scope.verifyDNSChanges = () => {
      DNSVerificationStartTime = (new Date()).getTime();
      $scope.verifyingDNSChanges = true;
      apiGateWay.get("/set_ses_identity", { verifyDNSChanges: 1 }).then(function(response) {
        if (response.data.status == 200) {
          $scope.dnsBtnClicked = true;
          DNSVerificationEndTime = (new Date()).getTime();
          var responseData = response.data.data ? response.data.data.data : {};
          parseSesData(responseData);
          var resTime = DNSVerificationEndTime-DNSVerificationStartTime;
          if (resTime > 1000) {
            $scope.verifyingDNSChanges = false;
          } else {
            $timeout(function() {
              $scope.verifyingDNSChanges = false;
            }, 200)
          }
        }
      });
    }
    $scope.reverifyDNSChanges = () => {
      DNSVerificationStartTime = (new Date()).getTime();
      $scope.verifyingDNSChanges = true;
      apiGateWay.get("/reset_ses_identity", { verifyDNSChanges: 1 }).then(function(response) {
        if (response.data.status == 200) {
          $scope.dnsBtnClicked = true;
          DNSVerificationEndTime = (new Date()).getTime();
          var responseData = response.data.data ? response.data.data.data : {};
          parseSesData(responseData);
          var resTime = DNSVerificationEndTime-DNSVerificationStartTime;
          if (resTime > 1000) {
            $scope.verifyingDNSChanges = false;
          } else {
            $timeout(function() {
              $scope.verifyingDNSChanges = false;
            }, 200)
          }
        }
      });
    }
    var getEmailFrom = function(isVerifiyingDNSChanges=0){
      $scope.dnsRecordsData = [];
      apiGateWay.get("/set_ses_identity").then(function(response) {
        if (response.data.status == 200) {
          var responseData = response.data.data ? response.data.data.data : {};
          parseSesData(responseData);
          $scope.sendFromEmailUpdating = false;
        }
      });
    }
    var parseSesData = function(responseData) {         
        $scope.settingData.replyFrom = responseData.fromEmail ? responseData.fromEmail : 'notify@poolbrain.com';
        $scope.replyFrom = responseData.fromEmail;                
        $scope.sesEmailStatus = responseData.sesEmailStatus;
        // add verification before updating existing DNS records in case of revrification
        let isDNSRecordsExist = false;
        if (responseData.DKIM_Tokens && responseData.DKIM_Tokens.length > 0) {
          angular.forEach(responseData.DKIM_Tokens, function(element, key){
            if (element && element[0] == 'CNAME') {
              isDNSRecordsExist = true;
            }
          });
        }
        if (isDNSRecordsExist) {
          $scope.dnsRecordsData = responseData.DKIM_Tokens;
        }
        let email = responseData.fromEmail;
        if (email && email != 'notify@poolbrain.com' && email.includes('@')) {
          let emailArr = email.split('@');
          let domain = emailArr[1];
          if (domain == 'poolbrain.com') {
            var emailInputBox = document.querySelectorAll('#replyFrom')[0];
            if (emailInputBox) { emailInputBox.classList.add('domain-error') }
            $scope.domainErrorMsg = 'You can only use emails from a domain you own since you have to be able to alter the DNS records for this feature to work. (poolbrain.com) is an email service and not a website/domain name you own ';
            $scope.sesEmailStatus = 'PBDomainError'
            $scope.dnsRecordsData = []
            // return
          }
        } 
    }
    $scope.dnsRecordsModal = null;
    $scope.dnsBtnClicked = false;
    $scope.opendnsRecordsModal = () => {
      $scope.dnsRecordsModal = ngDialog.open({
        template: 'dnsRecordsModal.html',
        className: 'ngdialog-theme-default',
        closeByDocument: true,
        scope: $scope,
        preCloseCallback: function (data) {

        }
    });
    }
    $scope.copySuccessMsg = '';
    $scope.copyDnsRecord = async (record, type='') => {
      let contentToCopy = '';
      if (type == 'Name') {
        contentToCopy = record[1];
      }
      if (type == 'Value') {        
        contentToCopy = record[2];
        // START - if MX Record has priority value
        let contentToCopyArr = contentToCopy.split(' ');
        if (record[0] == 'MX' && contentToCopyArr.length > 0) {
          contentToCopy = contentToCopyArr[1]
        }
        // END - if MX Record has priority value
      }
      $scope.copySuccessMsg = '';
      function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          if (successful) {
            $scope.copySuccessMsg = type + ' copied to clipboard';
            $timeout(function() {
              $scope.copySuccessMsg = ''
            }, 500)
          } else {
            console.error('copy failed')
          }
        } catch (err) {
          console.error('copy failed')
        }
        document.body.removeChild(textArea);
      }
      function copyTextToClipboard(text) {
        if (!navigator.clipboard) {
          fallbackCopyTextToClipboard(text);
          return;
        }
        navigator.clipboard.writeText(text).then(function() {
          $scope.copySuccessMsg = type + ' copied to clipboard';
          $timeout(function() {
            $scope.copySuccessMsg = ''
          }, 500)
        }, function(err) {
          console.error('copy failed')
        });
      }
      copyTextToClipboard(contentToCopy)
    }
    var getsettingCompany = function(){
        $rootScope.settingPageLoaders.logoSection = true;
        $rootScope.settingPageLoaders.emailSection = true;
        $rootScope.settingPageLoaders.emailSectionTemplate = true;
        $rootScope.settingPageLoaders.domainSection = true;
        apiGateWay.get("/company/settings").then(function(response) {
            if (response.data.status == 200) {
                var responseData = response.data;
                $scope.sbModel.loginKey = responseData.data.SBUserName;
                $scope.sbModel.password = responseData.data.SBPassword;
                $scope.sbModel.jobEmailSummery = responseData.data.jobEmailSummery;
                $scope.responseData = responseData.data;
                $scope.settingData.replyTo = responseData.data.replyTo;
                $rootScope.replyToEmailQuoteSetting = responseData.data.replyTo;
                $scope.replyToEmail = responseData.data.replyTo;
                $scope.settingData.subject = responseData.data.subject ? responseData.data.subject : "Your pool has been cleaned - thank you!";
                $scope.settingData.emailContent = responseData.data.emailBody;
                // $scope.checkListArray = responseData.data.serviceLevel[0] ? responseData.data.serviceLevel[0].checkList : [];
                // $rootScope.sendServiceLevelArrayComponent();
                if(responseData.data.domain){
                  $scope.subDomainExist = true;
                }
                $scope.cpModel.domain =  responseData.data.domain;

                if (!$scope.$$phase){$scope.$apply();}
                $scope.settingData.companyLogo = responseData.data.logo;
                editorContent = responseData.data.emailBody;
                if(responseData && responseData.data){
                    $scope.userCanImportSB = responseData.data.SBUserName ? true : false;
                    $scope.quickbookData = responseData.data.quickBook && responseData.data.quickBook.id ? responseData.data.quickBook : false
                    //$scope.isQuickBookConnect = responseData.data.quickBook && responseData.data.quickBook.id ? true : false;
                    // setTimeout(function(){
                    //     $scope.quick_book_success = false;
                    // }, 2000);
                    setTimeout(() => {
                      $scope.updateTabScroll();
                    },1000);
                }
            }
            $scope.isProcessing = false;
            $scope.includeEmail.includeChemicalReading = responseData.data.includeChemicalReading;
            $scope.includeEmail.includeChemicalAdded   = responseData.data.includeChemicalAdded;
            $rootScope.settingPageLoaders.logoSection = false;
            $rootScope.settingPageLoaders.emailSection = false;
            $rootScope.settingPageLoaders.domainSection = false;
            $rootScope.settingPageLoaders.emailSectionTemplate = false;
        }, function(error) {
            $rootScope.settingPageLoaders.logoSection = false;
            $rootScope.settingPageLoaders.emailSection = false;
            $rootScope.settingPageLoaders.domainSection = false;
            $rootScope.settingPageLoaders.emailSectionTemplate = false;
            $scope.settingData.subject = "Your pool has been cleaned - thank you!";
            $scope.settingData.emailContent = '<p>For your review, here are details and pictures of our most recent cleaning visit. Thank you.</p>';
            $scope.isProcessing = false;
        });
    }

    $scope.addNewRow = function(){
        //$scope.customChemicals
        var addObject = {
          "orderBy": 0,
          "chemicalMasterId": 0,
          "name":"",
          "price": 0,
          "priceCharge":0,
          "value":0,
          "raiseLowerBy":0,
          "status":1,
          "chemicalCondition":0,
          "chemicalKey":"",
          "chemicalStatus":1,
          "type":"Raise",
          "id":0,
          "unit":"",
          "parent":"",
          "elementType": "input"
        }
        var lastOrder = $scope.customChemicals[$scope.customChemicals.length-1].orderBy;
        addObject.orderBy = (lastOrder+1);
        $scope.customChemicals.push(addObject);
    }

    $scope.removeCustomChemical = function(chemicalObj, index){
      if(chemicalObj.id){
        openConfirmModel(chemicalObj, index);
      }else{
        $scope.customChemicals.splice(index, 1);
      }

    }

    $scope.chemicalUnits = {
      'sodaAsh': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'muriaticAcid': ['ounce', 'cup', 'quart', 'gallon', 'bottle', 'container', 'pod'],
      'dichlorShock': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'sodiumThiosulfate': ['ounce', 'cup', 'quart', 'gallon', 'bottle', 'container', 'pod'],
      'sodiumBicarbonate': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'stabilizer': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'tabs': ['gallon', 'bag', 'ounce', 'pound', 'scoop', 'bottle', 'container', 'cup', 'quart'],
      'liquidChlorine': ['ounce', 'cup', 'quart', 'gallon', 'bottle', 'container', 'pod'],
      'trichlorShock': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'calhypoShock': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'dryAcid': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'custom': ['ounce', 'pound', 'cup', 'quart', 'gallon', 'bag', 'scoop', 'bottle', 'container', 'pod', 'tab', 'bucket'],
      'salt': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod'],
      'sulfuricAcid': ['ounce', 'cup', 'quart', 'gallon', 'bottle', 'container', 'pod'],
      'calciumFlake': ['ounce', 'pound', 'bag', 'scoop', 'bottle', 'container', 'pod']
    }

    $scope.calculatePriceperNewUnit = function(){
      if($scope.calModal && $scope.calModal.newValue){
          var selectedChemical = angular.copy($scope.selectedChemical);
          let combineOrderedChemicalSelected = null
          if (selectedChemical.parent == 'chlorine' || selectedChemical.parent == 'ph') {
            combineOrderedChemicalSelected = $scope.chemicalOption[selectedChemical.parent].find(obj => obj.id === selectedChemical.id)  
          }
          if ((selectedChemical.parent != 'chlorine' && selectedChemical.parent != 'ph') || combineOrderedChemicalSelected == null) {          
            combineOrderedChemicalSelected = $scope.combineOrderedChemical.find(obj => obj.id === selectedChemical.id)  
          } 
          
          combineOrderedChemicalSelected.unit = angular.copy($scope.selectedUnit);
          combineOrderedChemicalSelected.unitConversionValue = $scope.calModal.newValue;
          $scope.selectedUnit = '';
          $scope.index = '';
          ngDialog.closeAll();
      }
    }

    $scope.calModal = {newValue: 0}
    $scope.priceUnitCalcModel = function(chemical, selectedUnit, defaultUnit){
      // $scope.index = index;
      $scope.selectedChemical = chemical;
      let combineOrderedChemicalSelected = null
        if (chemical.parent == 'chlorine' || chemical.parent == 'ph') {
          combineOrderedChemicalSelected = $scope.chemicalOption[chemical.parent].find(obj => obj.id === chemical.id)    
        }
        if ((chemical.parent != 'chlorine' && chemical.parent != 'ph') || combineOrderedChemicalSelected == null) {          
          combineOrderedChemicalSelected = $scope.combineOrderedChemical.find(obj => obj.id === chemical.id)  
        }      
        if(selectedUnit == defaultUnit){
            combineOrderedChemicalSelected.unit = selectedUnit;
            combineOrderedChemicalSelected.unitConversionValue = 1;
            $scope.editChemical($scope.settingForm, true, combineOrderedChemicalSelected);
            return false;
        }

        $scope.selectedUnit = selectedUnit;
        $scope.defaultUnit = defaultUnit;
        $scope.calModal = {newValue: 0};
        ngDialog.open({
            template: 'priceUnitCalcModel.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.editChemical($scope.settingForm, true, combineOrderedChemicalSelected);
            }
        });

    }

    var openConfirmModel = function(chemicalObj, index){
        $scope.chemicalObj = chemicalObj;
        $scope.index = index;
        ngDialog.open({
            template: 'removeChemicalConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {

            }
        });
    }

    $scope.closeModal= function(){
      ngDialog.closeAll();
    }

    $scope.confirmAction = function(chemicalObj, index){
        var payload = {
          chemicalKey: chemicalObj.chemicalKey,
          chemicalMasterId: chemicalObj.chemicalMasterId,
          raiseLowerId: chemicalObj.id
        }
        $scope.isProcessing = true;
        $rootScope.settingPageLoaders.chemicalSettingSection = true;
        apiGateWay.send("/delete_chemical", payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.customChemicals.splice(index, 1);
                $scope.closeModal();
                $scope.updateTabScroll();

            }
            $scope.isProcessing = false;
            $rootScope.settingPageLoaders.chemicalSettingSection = false;
        }, function(error){
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.chemicalSettingSection = false;
        })
    }

    $scope.createChemicalKey = function(index, name){

        chemicalKey = name.replace(' ', '');
        chemicalKey = chemicalKey.replace('-', '');
        chemicalKey = chemicalKey.replace('/', '');
        chemicalKey = chemicalKey.replace('~', '');
        chemicalKey = chemicalKey.replace('!', '');
        chemicalKey = chemicalKey.replace('@', '');
        chemicalKey = chemicalKey.replace('#', '');
        chemicalKey = chemicalKey.replace('$', '');
        chemicalKey = chemicalKey.replace('%', '');
        chemicalKey = chemicalKey.replace('^', '');
        chemicalKey = chemicalKey.replace('&', '');
        chemicalKey = chemicalKey.replace('*', '');
        chemicalKey = chemicalKey.replace('(', '');
        chemicalKey = chemicalKey.replace(')', '');
        chemicalKey = chemicalKey.replace('=', '');
        chemicalKey = chemicalKey.replace(' ', '');
        chemicalKey = chemicalKey.toLowerCase();

        if($scope.customChemicals[index].id==0){
          $scope.customChemicals[index].chemicalKey = chemicalKey+Math.floor(Math.random() * 9999999); ;
        }
    }

    $scope.getChemicalList = function(chemical){
        return chemical == 'chlorine' ? $scope.chlorineOption : $scope.phOption;
    }

    $scope.setModalValue = function(parent, index, chemicalObj){
      if($scope.chemicalOption[parent]){
        optionIndex = $scope.chemicalOption[parent].findIndex(x => x.id === chemicalObj.id);
        if(optionIndex >= 0){
          $scope.chemicalValues[parent].name = chemicalObj.name;
          $scope.chemicalValues[parent].chemicalKey = chemicalObj.chemicalKey;
          $scope.chemicalOption[parent][optionIndex].chemicalName = chemicalObj.name;
          $scope.chemicalOption[parent][optionIndex].unit = chemicalObj.unit;
          $scope.chemicalOption[parent][optionIndex].defaultUnit = chemicalObj.defaultUnit;
          $scope.chemicalOption[parent][optionIndex].displayName = chemicalObj.displayName;
          $scope.chemicalOption[parent][optionIndex].priceCharge = chemicalObj.priceCharge;
          $scope.chemicalOption[parent][optionIndex].price = chemicalObj.price;
          $scope.chemicalOption[parent][optionIndex].swimWait = chemicalObj.swimWait;
          $scope.chemicalOption[parent][optionIndex].id = chemicalObj.id;
          $scope.chemicalOption[parent][optionIndex].chemicalSettingId = chemicalObj.chemicalSettingId;
          $scope.chemicalOption[parent][optionIndex].unitConversionValue = chemicalObj.unitConversionValue;
        }
      }
      $scope.combineOrderedChemical[index].chemicalKey = chemicalObj.chemicalKey;
      $scope.combineOrderedChemical[index].chemicalName = chemicalObj.name;
      $scope.combineOrderedChemical[index].unit = chemicalObj.unit;
      $scope.combineOrderedChemical[index].defaultUnit = chemicalObj.defaultUnit;
      $scope.combineOrderedChemical[index].displayName = chemicalObj.displayName;
      $scope.combineOrderedChemical[index].priceCharge = chemicalObj.priceCharge;
      $scope.combineOrderedChemical[index].price = chemicalObj.price;
      $scope.combineOrderedChemical[index].swimWait = chemicalObj.swimWait;
      $scope.combineOrderedChemical[index].id = chemicalObj.id;
      $scope.combineOrderedChemical[index].chemicalSettingId = chemicalObj.chemicalSettingId;
      $scope.combineOrderedChemical[index].unitConversionValue = chemicalObj.unitConversionValue;
    }

    $scope.checkServiceBridgeForDisabled = function(){
        return $scope.responseData.SBUserName == $scope.sbModel.loginKey && $scope.responseData.SBPassword == $scope.sbModel.password;
    }

    $scope.checkOtherCRMForDisabled = function(){
        return $scope.responseData.otherCRM == $scope.sbModel.otherCRM;
    }

    if($rootScope.currentState == 'app.companysettings' || $rootScope.currentState == 'app.onetimejob' || $rootScope.currentState == 'administrator.settings'){
      $scope.getCompanySettings();
    }

    $scope.sbModel = {
      loginKey: '',
      password: '',
      otherCRM: '',
      type: ''
    }
    $scope.saveServiceBridge = function(){
      $scope.sbModel.type = 'verifyServiceCredentials';
      $scope.saveServiceBridgeCredentials(true, true);
    }
    $scope.updateCompanySettings = function(){
      $scope.sbModel.type = 'settings';
      $scope.sbModel.jobEmailSummery = angular.copy(!$scope.sbModel.jobEmailSummery);
      $scope.saveServiceBridgeCredentials(false, false);
    }

    $scope.saveNImportServiceBridge  = function(){
      $scope.sbModel.type = 'verifyServiceCredentials';
      $scope.saveServiceBridgeCredentials(true, true);
    }

    $scope.saveOtherCRM = function() {
           $scope.isProcessing = true;
           let text = $scope.sbModel.otherCRM;
           apiGateWay.send("/company/othercrm", {"othercrm":text}).then(function(response) {
                 var responseData = response.data;
                 var message = responseData && responseData.message ? responseData.message : "";
                 if (responseData.status == 200) {
                    $scope.success = response.data.message;
                    $scope.responseData.otherCRM = 1;
                    $scope.isProcessing = false;
                    setTimeout(() => {
                      $scope.updateTabScroll();
                    },1000);
                 } else {
                   $scope.error = message;
                   $scope.isProcessing = false;
                 }
               },
               function(errorResponse) {
                $scope.error = errorResponse;
                $scope.isProcessing = false;
               }
             );
    };

    $scope.saveServiceBridgeCredentials = function(runImpoertCustomer, refreshSettings){
      runImpoertCustomer = runImpoertCustomer || false;
      refreshSettings = refreshSettings || false
      $scope.isProcessing = true;
      if ($scope.sbModel.type == 'settings') {
        $rootScope.settingPageLoaders.emailSection = true;
      }
      $scope.successEmailMessage= '';
      $scope.error = '';
      apiGateWay.send("/company/settings", $scope.sbModel).then(function(response) {
          if (response.data) {
              if (response.data.status == 200) {
                $scope.successEmailMessage= response.data.message;
                $scope.responseData.SBUserName = $scope.sbModel.loginKey;
                $scope.responseData.SBPassword = $scope.sbModel.password;
                $scope.responseData.jobEmailSummery = $scope.sbModel.jobEmailSummery;

                $scope.userCanImportSB = true;
                if(runImpoertCustomer){
                    $scope.importCompanyCustomers();
                }
                if(refreshSettings){
                  setTimeout(function(){
                      $scope.getCompanySettings();
                      $rootScope.getCrmStatus();
                      $scope.updateTabScroll();
                  }, 2000);
                }
              } else {
                $scope.error = response.data.message;
              }
          }
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.emailSection = false;
          resetMessage();
      }, function(error) {
          $scope.error = error;
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.emailSection = false;
          resetMessage();
      });
    }

    $scope.importProcessing = false;
    $scope.refreshCustomerPgae = false;
    $scope.importCompanyCustomers = function(){
        $scope.isProcessing = true;
        $scope.importProcessing = true;
        $scope.successImport = false;
        apiGateWay.get("/sync_customers", $scope.sbModel).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                  $scope.successImport = response.data.message;
                  setTimeout(function(){
                    $scope.refreshCustomerPgae = true;
                    $scope.isProcessing = false
                    $scope.updateTabScroll();
                  }, 5000);
                } else {
                  $scope.error = response.data.message;
                }
            }
            $scope.isProcessing = false;
            $scope.importProcessing = false;
            resetMessage();
        }, function(error) {
            $scope.error = error;
            $scope.isProcessing = false;
            $scope.importProcessing = false;
            resetMessage();
        });
    }
    $scope.SyncCompanyCustomers = function(type='all'){
        $scope.isProcessing = true;
        $scope.successSync = false;
        $rootScope.settingPageLoaders.qboSection.qboSyncing = true;
        apiGateWay.get("/sync_customers_qb",{type:type}).then(function(response) {
            if (response.data) {
                if ($rootScope.getCompanyPreferencesGlobal) $rootScope.getCompanyPreferencesGlobal();
                if (response.data.status == 200) {
                  if($scope.qboSyncEnabled) {
                    $scope.syncQBOCron()
                  }
                  $scope.successSync = response.data.message;
                  setTimeout(function(){
                    $scope.isProcessing = false;
                    $scope.successSync = false;
                  }, 5000);
                } else {
                  $scope.error = response.data.message;
                }
            }
            $scope.isProcessing = false;
            $rootScope.settingPageLoaders.qboSection.qboSyncing = false;
            resetMessage();
        }, function(error) {
            $scope.error = error;
            $scope.isProcessing = false;
            $rootScope.settingPageLoaders.qboSection.qboSyncing = false;
            resetMessage();
        });
    }




    var resetMessage = function(){
      setTimeout(function(){
        $scope.successLogo = '';
        $scope.successEmailMessage = '';
        $scope.successImport = '';
        $scope.errorLogo = '';
        $scope.errorEmailMessage = '';
        $scope.error = '';
        $scope.successCustomerPortal = '';
        $scope.errorCustomerPortal = '';
      }, 2000);
    }


    //to get chemical setting data
   $scope.getChemicalsSetting = function() {
       $scope.isProcessing = true;
       apiGateWay.get("/chemicals_setting").then(function(response) {
           if (response.data) {
               if (response.data.status == 200) {
                   $scope.chemicalsData = response.data.data;
               } else {
                   $scope.chemicalsData = [];
               }
           }
           $rootScope.settingPageLoaders.chemicalSettingSection = false;
       }, function(error) {
          $rootScope.settingPageLoaders.chemicalSettingSection = false;
           var analyticsData = {};
               analyticsData.requestData = {

               };
               analyticsData.userData = $rootScope.userSession;
               analyticsData.actionTime = new Date();
               analyticsData.errorData = error;
               var analyticsDataString = JSON.stringify(analyticsData);
               var currentDateTime = $filter('date')(new Date(), "dd/MM/yyyy hh:m:ss a");
               $rootScope.storeAnalytics('Error - Get Checmical Setting', "Error on getChemicalsSetting - " + currentDateTime, analyticsDataString, 0, true);
       });
    };

  var intervalIns = '';
  $scope.submitChamicalSettingForm = function () {
    // window.addEventListener('click', function(e){
    //   if(document.getElementById('chemical-setting-area')){
    //     if (document.getElementById('chemical-setting-area').contains(e.target)){
    //       // Clicked in box
    //     } else{
    //       // Clicked outside the box
    //       $scope.clearInterval();
    //     }
    //   }
    // });
    if (intervalIns) { clearInterval(intervalIns); }
    if (document.getElementById('chemicalSettingSubmitButton')) {
      intervalIns = setInterval(function () {
        document.getElementById('chemicalSettingSubmitButton').click();
      }, 1000)
    }
  }

  $scope.clearInterval = function(){
    if(intervalIns){ clearInterval(intervalIns);}
  }

  $scope.addEditSetting = function(settingForm) {
  $scope.clearInterval()
    $scope.settingForm = settingForm;
    if ($scope.settingForm.$valid) {
       $scope.isProcessing = true;
       angular.forEach($scope.combineOrderedChemical, function(data, postIndex){
        if($scope.combineOrderedChemical[postIndex].price) {
          $scope.combineOrderedChemical[postIndex].price =  $scope.combineOrderedChemical[postIndex].price.toString(); //reverse masking
          $scope.combineOrderedChemical[postIndex].price = $scope.combineOrderedChemical[postIndex].price.replace(/\$|,/g, ''); //reverse masking
        }
        if($scope.combineOrderedChemical[postIndex].priceCharge) {
          $scope.combineOrderedChemical[postIndex].priceCharge =  $scope.combineOrderedChemical[postIndex].priceCharge.toString(); //reverse masking
          $scope.combineOrderedChemical[postIndex].priceCharge = $scope.combineOrderedChemical[postIndex].priceCharge.replace(/\$|,/g, ''); //reverse masking
        }
     });
      angular.forEach($scope.customChemicals, function(data, custIndex){
          if($scope.customChemicals[custIndex].price) {
            $scope.customChemicals[custIndex].price =  $scope.customChemicals[custIndex].price.toString(); //reverse masking
            $scope.customChemicals[custIndex].price = $scope.customChemicals[custIndex].price.replace(/\$|,/g, ''); //reverse masking
          }
          if($scope.customChemicals[custIndex].priceCharge) {
            $scope.customChemicals[custIndex].priceCharge =  $scope.customChemicals[custIndex].priceCharge.toString(); //reverse masking
            $scope.customChemicals[custIndex].priceCharge = $scope.customChemicals[custIndex].priceCharge.replace(/\$|,/g, ''); //reverse masking
          }
       });
       apiGateWay.send("/chemicals_setting", {
            postData: $scope.combineOrderedChemical,
            customChemical: $scope.customChemicals
       }).then(function(response) {
           if (response.data.status == 201) {
              //  $scope.getCompanySettings();
               $scope.isProcessing = false;
               $scope.successChemical = response.data.message;

               var newAddedChemical = response.data.data;
               if(newAddedChemical && Object.keys(newAddedChemical).length > 0){
                  var existingCustomChemical = angular.copy($scope.customChemicals);
                  angular.forEach(existingCustomChemical, function(element, index){
                      if(newAddedChemical[element.chemicalKey]){
                      $scope.customChemicals[index].id = newAddedChemical[element.chemicalKey].raiseLowerId;
                      $scope.customChemicals[index].chemicalMasterId = newAddedChemical[element.chemicalKey].chemicalMasterId;
                      $scope.customChemicals[index].chemicalSettingId = newAddedChemical[element.chemicalKey].chemicalSettingId;
                    }
                  });
               }
               $scope.errorChemical = '';
               setTimeout(function() {
                   $scope.successChemical = '';
               }, 2000);
               var analyticsData = {};
               analyticsData.userData = $rootScope.userSession;
               analyticsData.data = $scope.chemicalsData;
               analyticsData.actionTime = new Date();
               var analyticsDataString = JSON.stringify(analyticsData);
               var currentDateTime = $filter('date')(new Date(), "dd/MM/yyyy hh:m:ss a");
               $rootScope.storeAnalytics('Chemical Setting', "Update Checmical Setting - "+currentDateTime, analyticsDataString, 0, true);
           } else {
               $scope.successChemical = '';
               $scope.errorChemical = response.data.message;
               setTimeout(function() {
                   $scope.error = '';
               }, 2000);
           }
       }, function(error) {
          // $scope.getCompanySettings();
           var msg = 'Unable to update data.';
           if (typeof error == 'object' && error.data && error.data.message) {
               msg = error.data.message;
           } else {
               msg = error;
           }
           var analyticsData = {};
           analyticsData.requestData = {
               postData: $scope.chemicalsData
           };
           analyticsData.userData = $rootScope.userSession;
           analyticsData.actionTime = new Date();
           analyticsData.errorData = error;
           var analyticsDataString = JSON.stringify(analyticsData);
           var currentDateTime = $filter('date')(new Date(), "dd/MM/yyyy hh:m:ss a");
           $rootScope.storeAnalytics('Error - Update Setting', "Error on addEditSetting - "+msg+" - " + currentDateTime, analyticsDataString, 0, true);
           $scope.successChemical = '';
           $scope.errorChemical = msg;
           setTimeout(function() {
               $scope.errorChemical = '';
               $scope.isProcessing = false;
           }, 2000);
       });
    }
  };
  $scope.selectedChemicalForDoseTarget = null;
  $scope.doseTargetModalOpened = false;
  $scope.openDoseTargetModal = (chemical) => {
    $scope.selectedChemicalForDoseTarget = angular.copy(chemical);
    $scope.doseTargetModalOpened = true;    
    $scope.doseTargetModal = ngDialog.open({
      template: 'doseTargetModal.html',
      className: 'ngdialog-theme-default v-center',
      closeByDocument: true,
      scope: $scope,
      preCloseCallback: function (data) {
        $scope.selectedChemicalForDoseTarget = null;
        $scope.doseTargetModalOpened = false;
      }
    });
  }
  $scope.removeDefaults = (chemicals) => {
    chemicals.map((chem)=>{
      chem.chemicalStatus = 0
    })
  }
  $scope.editChemReadingTarget = function (settingForm, index, chemical, editType='edit_chemical', updateAction='any') {
    $scope.selectedChemicalForDoseTarget.isRangeError = false;
    let _target = chemical.target;
    if (_target) {
      _target = _target + '';
      let secondDotIndex = _target.indexOf('.', _target.indexOf('.') + 1);
      if (secondDotIndex !== -1) {
        _target = _target.substring(0, secondDotIndex);
      }
      if (_target.includes('.')) {
        let _targetStrArr = _target.split('.');
        _target = _targetStrArr[0] + '.' + _targetStrArr[1].substring(0,2)
      }
      _target = Number(_target);      
      chemical.target = _target
    }
    if (isNaN(chemical.target)) {
      $scope.selectedChemicalForDoseTarget.isRangeError = true;
      return
    }
    if (Number(chemical.minimumTarget) > Number(chemical.target) || Number(chemical.maximumTarget) < Number(chemical.target)) {
      $scope.selectedChemicalForDoseTarget.isRangeError = true;
      return
    } else {      
      $scope.editChemical(settingForm, index, chemical, editType, updateAction)
    }
  }
  $scope.editChemical = function (settingForm, index, chemical, editType='edit_chemical', updateAction='any') {
    if(chemical.$$hashKey) delete chemical.$$hashKey;
    $scope.clearInterval();
    $scope.settingForm = settingForm;
    if (index !== null || index !== undefined || chemical) {
      if (updateAction != 'target') {
        angular.forEach($scope.combineOrderedChemical, function (data, postIndex) {
            if ($scope.combineOrderedChemical[postIndex].price) {
              $scope.combineOrderedChemical[postIndex].price = $scope.combineOrderedChemical[postIndex].price.toString();
              $scope.combineOrderedChemical[postIndex].price = $scope.combineOrderedChemical[postIndex].price.replace(/\$|,/g,"");
            }
            if ($scope.combineOrderedChemical[postIndex].priceCharge) {
              $scope.combineOrderedChemical[postIndex].priceCharge = $scope.combineOrderedChemical[postIndex].priceCharge.toString();
              $scope.combineOrderedChemical[postIndex].priceCharge = $scope.combineOrderedChemical[postIndex].priceCharge.replace(/\$|,/g,"");
            }
          }
        );
        angular.forEach($scope.customChemicals, function (data, custIndex) {
          if ($scope.customChemicals[custIndex].price) { 
            $scope.customChemicals[custIndex].price = $scope.customChemicals[custIndex].price.toString();
            $scope.customChemicals[custIndex].price = $scope.customChemicals[custIndex].price.replace(/\$|,/g, "");
          }
          if ($scope.customChemicals[custIndex].priceCharge) {
            $scope.customChemicals[custIndex].priceCharge = $scope.customChemicals[custIndex].priceCharge.toString();
            $scope.customChemicals[custIndex].priceCharge = $scope.customChemicals[custIndex].priceCharge.replace(/\$|,/g, "");
          }
        });
      }
      if (chemical.name !== undefined && chemical.unit !== '' || updateAction == 'target') {
        if (chemical.priceCharge) {
          chemical.priceCharge = chemical.priceCharge.toString();
          chemical.priceCharge = chemical.priceCharge.replace(/\$|,/g, "");          
        }
        if (chemical.price) {
          chemical.price = chemical.price.toString();
          chemical.price = chemical.price.replace(/\$|,/g, "");          
        }
        chemical.chemicalName = chemical.name;
        if(chemical.chemicalName == '' && updateAction != 'target'){
          return;
        }
        $scope.isProcessing = true;
        $rootScope.settingPageLoaders.chemicalSettingSection = true;
        let apiURL = '/edit_chemical';
        let payLoad = { ChemicalData: chemical };
        if (editType == 'chemical_dosing') {
          apiURL = '/chemical_dosing';
          payLoad = {
            chemicalMasterId: chemical.chemicalMasterId,
            updateAction: updateAction,
            value: '',
            chemicalKey: chemical.chemicalKey,
            chemicalType: chemical.parent
          }
          if (payLoad.updateAction == 'appStatus') {
            payLoad.value = chemical.appStatus
          }  
          if (payLoad.updateAction == 'Default Dosing') {
            payLoad.value = '';
            payLoad.raiseType = chemical.type
          }   
          if (payLoad.updateAction == 'dosingStatus') {
            payLoad.value = chemical.dosingStatus
          }   
          if (payLoad.updateAction == 'target') {
            payLoad.chemicalMasterId = chemical.id;
            payLoad.chemicalKey = chemical.key;
            payLoad.value = chemical.target;
          }   
        }
        apiGateWay
          .send(apiURL, payLoad)
          .then(
            function (response) {
              if (response.data.status == 201 || ((editType == 'chemical_dosing' || updateAction == 'target') && response.data.status == 200)) {
                $scope.isProcessing = false;                
                $scope.successChemical = response.data.message;
                if (updateAction == 'target') {
                  $scope.successChemical = 'Dose target updated';
                  $rootScope.chemicalReadingServiceArray.forEach(function(chemicalReadingService){
                    if (chemicalReadingService.isSystem == -1) {
                      if (chemicalReadingService.data && chemicalReadingService.data.length > 0) {
                          chemicalReadingService.data.forEach(function(chemicalReadingSetting){
                            if(chemicalReadingSetting.id == payLoad.chemicalMasterId) {
                              chemicalReadingSetting.target = response.data.data.target
                            }
                          })
                      }
                    }
                  });
                  if ($scope.doseTargetModal) {
                    $scope.doseTargetModal.close()
                  }
                }
                if($scope.chemicalOption[chemical.parent]){
                  optionIndex = $scope.chemicalOption[chemical.parent].findIndex(x => x.id === chemical.id);
                  if(optionIndex != undefined && optionIndex >= 0) {
                    $scope.chemicalOption[chemical.parent][optionIndex].unit = chemical.unit; 
                    $scope.chemicalOption[chemical.parent][optionIndex].unitConversionValue = chemical.unitConversionValue; 
                  }
                }
                var newAddedChemical = response.data.data;
                if (
                  newAddedChemical &&
                  Object.keys(newAddedChemical).length > 0
                ) {
                  var existingCustomChemical = angular.copy(
                    $scope.customChemicals
                  );
                  angular.forEach(existingCustomChemical, function (element, index) { 
                      if (newAddedChemical[element.chemicalKey]) {
                        $scope.customChemicals[index].id = newAddedChemical[element.chemicalKey].raiseLowerId;
                        $scope.customChemicals[index].chemicalMasterId = newAddedChemical[element.chemicalKey].chemicalMasterId;
                        $scope.customChemicals[index].chemicalSettingId = newAddedChemical[element.chemicalKey].chemicalSettingId;
                      }
                    }
                  );
                }
                // 
                if (payLoad.updateAction == 'dosingStatus') {
                  let _chemicalForUpdate = null
                  if (chemical.parent == 'chlorine' || chemical.parent == 'ph') {
                    _chemicalForUpdate = $scope.chemicalOption[chemical.parent].find(obj => obj.id === chemical.id)  
                  }
                  if ((chemical.parent != 'chlorine' && chemical.parent != 'ph') || _chemicalForUpdate == null) {          
                    _chemicalForUpdate = $scope.combineOrderedChemical.find(obj => obj.id === chemical.id)  
                  }                  
                  if (payLoad.updateAction == 'dosingStatus') {
                    _chemicalForUpdate.dosingStatus = chemical.dosingStatus
                  }
                }                 
                // 
                $scope.errorChemical = "";
                setTimeout(function () {
                  $scope.successChemical = "";
                }, 2000);
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = $scope.chemicalsData;
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter("date")(
                  new Date(),
                  "dd/MM/yyyy hh:m:ss a"
                );
                $rootScope.storeAnalytics(
                  "Chemical Setting",
                  "Update Checmical Setting - " + currentDateTime,
                  analyticsDataString,
                  0,
                  true
                );
              } else {
                $scope.successChemical = "";
                $scope.errorChemical = response.data.message;
                setTimeout(function () {
                  $scope.error = "";
                }, 2000);
              }
              $rootScope.settingPageLoaders.chemicalSettingSection = false;
            },
            function (error) {
              $rootScope.settingPageLoaders.chemicalSettingSection = false;
              // $scope.getCompanySettings();
              var msg = "Unable to update data.";
              if (
                typeof error == "object" &&
                error.data &&
                error.data.message
              ) {
                msg = error.data.message;
              } else {
                msg = error;
              }
              var analyticsData = {};
              analyticsData.requestData = {
                postData: $scope.chemicalsData,
              };
              analyticsData.userData = $rootScope.userSession;
              analyticsData.actionTime = new Date();
              analyticsData.errorData = error;
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(
                new Date(),
                "dd/MM/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics(
                "Error - Update Setting",
                "Error on addEditSetting - " + msg + " - " + currentDateTime,
                analyticsDataString,
                0,
                true
              );
              $scope.successChemical = "";
              $scope.errorChemical = msg;
              setTimeout(function () {
                $scope.errorChemical = "";
                $scope.isProcessing = false;
              }, 2000);
            }
          );
      }
    }
  };

  /*  $scope.timePickerOption = {format: 'HH:mm', showClear: false};
    $scope.pickTime = function(value, index){
      var triggertime = $filter('date')(value.toDate(), 'HH:mm');
  }*/

  /*Alert Admin Setting*/
  $scope.companyCustomerName = auth.getSession().firstName+' '+auth.getSession().lastName
  $scope.alertModel = {
    status:1,
    days:30,
    validateNotes:0,
  }

  $scope.getAdminAlertSetting = function(){
    $rootScope.settingPageLoaders.alertSection = true;
    apiGateWay.send("/company_dismiss_alert_settings", {"true":1}).then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data && response.data.data.length > 0){
            $scope.alertModel = response.data.data[0]
            $scope.onLoadDays = true;
          }
        }
        $rootScope.settingPageLoaders.alertSection = false;
      }, function(error){
      $rootScope.settingPageLoaders.alertSection = false;
    })
  }

  $scope.alertAdminSettingStatusToggle = function(){
    //$scope.companyId = auth.getSession().companyId

    $scope.alertModel.status = angular.copy(!$scope.alertModel.status);
    $scope.updateAlertAdminSetting();
  }
  $scope.alertAdminSettingNotesToggle = function(){
    $scope.alertModel.validateNotes = angular.copy(!$scope.alertModel.validateNotes);
    $scope.updateAlertAdminSetting();
  }
  $scope.$watch('alertModel.days', function (newVal, oldVal) {
    if($scope.alertModel){
      if(!newVal){
        $scope.alertModel.days = null;
        $scope.alertModel.status = 0;
      } else {
        if(!$scope.onLoadDays){
          $scope.alertModel.status = 1;
        }
        $scope.onLoadDays = false;
      }
    }
  }, true);
  $scope.$watch('settingData.replyTo', function (newVal, oldVal) {
    if (newVal) {
      $scope.settingData.replyTo = $scope.settingData.replyTo.toLowerCase()      
    }
  });
  $scope.$watch('settingData.replyFrom', function (newVal, oldVal) {
    if (newVal) {
      $scope.settingData.replyFrom = $scope.settingData.replyFrom.toLowerCase()      
    }
  });
  $scope.updateAlertAdminSetting = function(){
    var postData = angular.copy($scope.alertModel);
    postData.validateNotes = $scope.alertModel.validateNotes ? 1 : 0;
    postData.status = $scope.alertModel.days ? $scope.alertModel.status ? 1 : 0 : 0;
    $rootScope.settingPageLoaders.alertSection = true;
    apiGateWay.send("/dismiss_alert_settings", postData).then(function(response) {
        if (response.data.status == 200) {
            $scope.successUpdateAlert = response.data.message;
        }
        setTimeout(function(){
          $scope.successUpdateAlert = false;
          if (!$scope.$$phase) $scope.$apply()
          $scope.updateTabScroll();
        }, 2000);
        $rootScope.settingPageLoaders.alertSection = false;
    }, function(error){
      $rootScope.settingPageLoaders.alertSection = false;
    })
  }


  $scope.dismissAllAlertConfirm = function(){
    ngDialog.open({
        template: 'dismissAllAlertConfirm.html',
        className: 'ngdialog-theme-default',
        scope: $scope
    });
  }

  $scope.confirmDismissAllAlertAction = function(){
    $scope.isProcessing = true;
    ngDialog.closeAll()
    apiGateWay.send("/dismiss_alerts", {"name":$scope.companyCustomerName}).then(function(response) {
        if (response.data.status == 200) {
            $scope.successUpdateAlert = response.data.message;
        }
        setTimeout(function(){
          $scope.isProcessing = false;
          $scope.successUpdateAlert = false;
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
        $scope.isProcessing = false;
    }, function(error){
      $scope.isProcessing = false;
    })
  }



  $scope.chemicalReadingSettingModel = [];
  $scope.chemicalReadingDefault = [];
  $scope.chemicalReadingTab =function(index){
    $scope.sChemReadingSeTab = index;
    $scope.chemicalReadingSettingModel = angular.copy($rootScope.chemicalReadingServiceArray[index].data);
    $scope.chemicalReadingSettingModel.forEach(function(item){
      if(item.key == "salt"){
        if(!item.visits || item.visits == 1){
          $scope.isSingleVisit = true;
        }
        else{
          $scope.isSingleVisit = false;
        }
      }
    })
  }

  function moveArrayItemToNewIndex(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  };
  $scope.confirmLsiModalReadings = null;
  $scope.confirmLsiModal = null;
  $scope.chemicalReadingSettingToggleCheckLSI = function(chemicalReading) {
    let status = chemicalReading.status ? 0 : 1;
    let requiredLSIReadings = ['ph','calcium','alkalinity','cya','salt','watertemperature'];
    let isLsiRequired = requiredLSIReadings.includes(chemicalReading.key);
    if (status == 0 && isLsiRequired) {
      $scope.confirmLsiModalReadings = angular.copy(chemicalReading);
      $scope.confirmLsiModal = ngDialog.open({
        template: 'requiredLSIReading.html',
        className: 'ngdialog-theme-default v-center',
        closeByDocument: true,
        scope: $scope,
        preCloseCallback: function (data) {        
          $scope.confirmLsiModalReadings = null;
        }
      });
    } else {
      $scope.chemicalReadingSettingToggle(chemicalReading)
    }    
  }
  $scope.chemicalReadingSettingToggle = function(chemicalReading){
    if ($scope.confirmLsiModal) {
      $scope.confirmLsiModal.close();
    }
    let postData = { id: chemicalReading.id, key: chemicalReading.key, status: chemicalReading.status ? 0 : 1};
    $rootScope.settingPageLoaders.chemicalSettingSection = true;
    apiGateWay.send("/update_chemical_reading_status", postData).then(function(response){
      if (response.data.status == 200) {
        let _defaultSL = $rootScope.chemicalReadingServiceArray.find(o => o.isSystem === -1)
        angular.forEach(_defaultSL.data, function(item){
          if(item.id == chemicalReading.id){
            item.status = response.data.data.status;
          }
        });
      }
      $rootScope.settingPageLoaders.chemicalSettingSection = false;
    }, function(error){
      $rootScope.settingPageLoaders.chemicalSettingSection = false;
    });
  }
  $scope.getSortedChemicalGrid = function(arr) {
      const orderMap = {};
      const chemicalReadingServiceArrayOrder = [
        { order: 1, key: 'chlorine' },
        { order: 2, key: 'ph' },
        { order: 3, key: 'alkalinity' },
        { order: 4, key: 'cya' },
        { order: 5, key: 'phosphates' },
        { order: 6, key: 'tds' },
        { order: 7, key: 'calcium' },
        { order: 8, key: 'watertemperature' }, 
        { order: 9, key: 'bromine' },
        { order: 10, key: 'borates' },
        { order: 11, key: 'salt' },
        { order: 12, key: 'copper' },
        { order: 13, key: 'iron' },
        { order: 14, key: 'oxidationReductionPotential' },
        { order: 15, key: 'hydrogenPeroxide' },
      ];
      chemicalReadingServiceArrayOrder.forEach(item => {
          orderMap[item.key] = item.order;
      });
      arr.sort((a, b) => {
          return orderMap[a.key] - orderMap[b.key];
      });
      return arr
    }
  $scope.getChemicalReadingSetting = function(){
    $scope.chemicalReadingSettingModel = [];
    apiGateWay.get("/chemical_reading_details", {}).then(function(response) {
        if (response.data.status == 200) {
          $rootScope.chemicalReadingServiceArray = [];

          $scope.chemicalReadingDefault = angular.copy(response.data.data[0].data);
          angular.forEach(response.data.data, function(data, parentIndex){

            if(parentIndex != 0){
              $rootScope.chemicalReadingServiceArray.push(angular.copy(response.data.data[parentIndex]));

              angular.forEach($scope.chemicalReadingDefault, function(item, index){
                var filterData = data.data.filter(function(key){ return key.key == item.key})

                if(filterData.length > 0){
                  $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index] = angular.copy(filterData[0]);
                  $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index].value = angular.copy(item.value);
                } else{
                  $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index] =  angular.copy(item);
                }
                $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index].visits = $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index].visits ? $rootScope.chemicalReadingServiceArray[parentIndex-1].data[index].visits : null;
              });
            }
          });
          //move index 4 to index 8
          angular.forEach($rootScope.chemicalReadingServiceArray, function (item) {
            item.data.forEach(function (val){
              if(val.visits && val.visits > 1 && val.key != 'salt'){
                val.required = "2";
              }
              else if(val.visits && val.visits > 1 && val.key == 'salt' && (val.required == "0" || val.required == "1")){
                val.required = "2";
              }
            })
            if (item.data[4].key == 'salt') {
              item.data = moveArrayItemToNewIndex(item.data, 4, 8);
            }
          });
          $rootScope.chemicalReadingServiceArray = $rootScope.sortServiceLevel($rootScope.chemicalReadingServiceArray, 'chemReadings')
          $scope.chemicalReadingTab(0);
          setTimeout(() => {
            $scope.updateTabScroll();
          },1000);
        }
    }, function(error){
    })
  }

  $scope.toggleChemicalReadingSetting = function(index){
    if($scope.chemicalReadingSettingModel[index].key == 'salt'){
      $scope.chemicalReadingSettingModel[index].visits = '';
      $scope.multipleVisitsInput = false;
      if($scope.chemicalReadingSettingModel[index].required != 3){
        $scope.isSingleVisit = true;
        $scope.chemicalReadingSettingModel[index].visits = 1;
        $scope.saveChemicalReadingSetting(index);
      }
    } else {
      $scope.chemicalReadingSettingModel[index].visits = $scope.chemicalReadingSettingModel[index].required ? null : $scope.chemicalReadingSettingModel[index].visits;
      if($scope.chemicalReadingSettingModel[index].required != 2){
        $scope.saveChemicalReadingSetting(index);
      }
    }
  }

  $scope.selectEveryVisit = function(index){
    $scope.multipleVisitsInput = false;
    $scope.isSingleVisit = true;
    $scope.chemicalReadingSettingModel[index].visits = 1;
    $scope.saveChemicalReadingSetting(index);
  }

  $scope.selectMultipleVisits = function(index){
    $scope.isSingleVisit = false;
    $scope.multipleVisitsInput = true;
    $scope.chemicalReadingSettingModel[index].visits = 2;
    $scope.saveChemicalReadingSetting(index);
  }

  $scope.editChemicalReadingVisits = function(index){
    if($scope.chemicalReadingSettingModel[index].key != 'salt'){
      if($scope.chemicalReadingSettingModel[index].visits == 1 || !$scope.chemicalReadingSettingModel[index].visits){
        $scope.chemicalReadingSettingModel[index].required = '1';
        $scope.chemicalReadingSettingModel[index].visits = '';
      }
    }
    if($scope.chemicalReadingSettingModel[index].key == 'salt'){
      $scope.chemicalReadingSettingModel[index].required = $scope.chemicalReadingSettingModel[index].visits ? ($scope.chemicalReadingSettingModel[index].required == 0 ? '2' : $scope.chemicalReadingSettingModel[index].required) : $scope.chemicalReadingSettingModel[index].required;

      // $scope.chemicalReadingSettingModel[index].visits =  ($scope.chemicalReadingSettingModel[index].visits == null || $scope.chemicalReadingSettingModel[index].visits == 1) ? '' : $scope.chemicalReadingSettingModel[index].visits;
      if($scope.chemicalReadingSettingModel[index].visits == 1 && $scope.chemicalReadingSettingModel[index].required == 3){
        $scope.multipleVisitsInput = false;
        $scope.chemicalReadingSettingModel[index].required = '1';
        $scope.chemicalReadingSettingModel[index].visits = '';
      }
      else {
         $scope.multipleVisitsInput = true;
      }
      if($scope.chemicalReadingSettingModel[index].visits == 1 && $scope.chemicalReadingSettingModel[index].required == 2){
        $scope.multipleVisitsInput = false;
        $scope.isSingleVisit = true;
      }
      else{
        $scope.multipleVisitsInput = true;
        $scope.isSingleVisit = false;
      }
    }
    $scope.saveChemicalReadingSetting(index);
  }

  $scope.saveChemicalReadingSetting = function(index){
    $scope.isProcessing = true;
    var postData = angular.copy($scope.chemicalReadingSettingModel[index]);


    postData.cid = $scope.chemicalReadingSettingModel[index].id;
    postData.visits = $scope.chemicalReadingSettingModel[index].visits ? $scope.chemicalReadingSettingModel[index].visits : 0
    // postData.required = $scope.chemicalReadingSettingModel[index].visits ? 0 : postData.required;
    if($scope.chemicalReadingSettingModel[index].key == 'salt'){
      postData.required = $scope.chemicalReadingSettingModel[index].required;
    }
    postData.required = $scope.chemicalReadingSettingModel[index].required;

    postData.serviceLevelId = $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].serviceLevelId;
    apiGateWay.send("/update_chemical_reading", postData).then(function(response) {
        if (response.data.status == 200) {
          $scope.successChemicalReading = response.data.message;
          $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index] = response.data.data;
            // if($rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].key != 'salt'){
            //   $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].required = $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].required == 1 ? true : false;
            // }
            $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].visits = $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].visits ? $rootScope.chemicalReadingServiceArray[$scope.sChemReadingSeTab].data[index].visits : null;
        }
        setTimeout(function(){
          $scope.successChemicalReading = false;
          if (!$scope.$$phase) $scope.$apply();
          $scope.updateTabScroll()
        }, 2000);
        $scope.isProcessing = false;
    }, function(error){
    })
  }

  $rootScope.getServiceLevelTabName = function(){
    $scope.getChemicalReadingSetting()
    setTimeout(() => {
      $scope.updateTabScroll();
    },1000);
  }

  /*Tech Role*/


  $scope.generateInvoice = function(type=''){
    $scope.isProcessing = true;
    let url = '/single_first_of_month_invoice_cron';
    if(type=='arrears'){
      url = '/single_end_of_month_invoice_cron';
    }

    url = url + "?companyId=" + auth.getSession().companyId;
    apiGateWay.post(url, {}).then(function(response) {
      if (response.data.status == 200) {
        $scope.invoiceGenerated = 'Invoice Generated';
      } else {
        $scope.invoiceGeneratedError = 'There is some error in invoice setting'
      }
      $scope.isProcessing = false;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
        $scope.updateTabScroll();
      }, 2000);
    }, function(error){
      $scope.isProcessing = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 2000);
    })
  }


  $scope.syncInvoicesToQBO = function(type=''){
    $scope.isProcessing = true;
    let url = '/sync_invoices_to_qbo';

    apiGateWay.get(url, {companyId:auth.getSession().companyId}).then(function(response) {
      if (response.data.status == 200) {
        $scope.invoiceGenerated = '(' + response.data.data.totalInvoices + ') Invoices Synced';
      } else {
        $scope.invoiceGeneratedError = 'There is some error in invoice syncing'
      }
      $scope.isProcessing = false;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 5000);
    }, function(error){
      $scope.isProcessing = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 2000);
    })
  }

  $scope.enableQBOSync = function(currentProductAccount, currentRefundAccount, reTrySync = false){
    // if(currentProductAccount == '' || currentRefundAccount == '' || currentProductAccount == '--' || currentRefundAccount == '--')
    if(currentRefundAccount == '' || currentRefundAccount == '--') {
      $scope.invoiceGeneratedError = 'To activate billing sync, a bank account must be selected.';
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 5000);
      return false;

    }

    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.qboSection.invoiceSyncToggle = true;
    let url = '/enable_qbo_sync';
    let status = !$scope.qboSyncEnabled;
    if (reTrySync) {
      status = true
    }
    apiGateWay.send(url, { companyId:auth.getSession().companyId, status: status }).then(function(response) {
      $scope.qboSyncEnabled = response.data.data.status;
      if($scope.qboSyncEnabled) {
        $scope.syncQBOCron()
      }
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.qboSection.invoiceSyncToggle = false;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 5000);
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.qboSection.invoiceSyncToggle = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 2000);
    })
  }

  $scope.toggleQboItemsSync = function(currentProductAccount, currentRefundAccount){
    if(currentRefundAccount == '' || currentRefundAccount == '--') {
      $scope.invoiceGeneratedError = 'To activate billing sync, a bank account must be selected.';
      setTimeout(function(){
        $scope.invoiceGeneratedError = '';
      }, 2000);
      return false;
    }
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.qboSection.productToggle = true;
    let url = '/enable_qb_sync';
    apiGateWay.send(url, { companyId:auth.getSession().companyId, status: !$rootScope.isQboItemsSyncEnabled }).then(function(response) {
      $rootScope.isQboItemsSyncEnabled = response.data.data.status;      
      if(response.data.data.status) {
        $scope.enable_qb_sync_cron();
      }
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.qboSection.productToggle = false;
    }, function(error){
      $rootScope.settingPageLoaders.qboSection.productToggle = false;
      $scope.isProcessing = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGeneratedError = '';
      }, 2000);
    })
  }
  
  $scope.showTrackLocationError = false;
  $scope.companyTracklocations = false;
  $scope.checkTrackLocation = function(){    
    $scope.isProcessing = true;    
    $rootScope.settingPageLoaders.qboSection.departmentToggle = true;
    apiGateWay.get('/company_preferences').then(function(response){
      if (response.data.status == "200") {
        let resData = response.data.data.DATA;
        if (resData && resData.Tracklocations != null && resData.Tracklocations != undefined) {          
          $scope.companyTracklocations = resData.Tracklocations;
        }
        if ($scope.companyTracklocations) {  
          $scope.showTrackLocationError = false;        
          $scope.toggleTrackLocation();
        } else {
          $scope.showTrackLocationError = true;
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
        }
      } else {
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
      }      
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
    })
  }
  $scope.toggleTrackLocation = function() {
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.qboSection.departmentToggle = true;
    let url = '/company_dept_sync_status';
    apiGateWay.send(url, { companyId:auth.getSession().companyId, status: !$rootScope.isQBODeptSyncEnabled }).then(function(response) {
      if (response.data.status == "200") {
        $rootScope.isQBODeptSyncEnabled = response.data.data.status;      
        if(response.data.data.status) {
          $scope.fetch_departments_from_qbo();
        }
      }    
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
    }, function(error){
      $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
      $scope.isProcessing = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGeneratedError = '';
      }, 2000);
    })
  }
  
  $scope.fetch_departments_from_qbo = function() {
    let _payLoad = {        
      "companyId": auth.getSession().companyId
    }
    apiGateWay.get('/department', _payLoad).then(function(response) {
    }, function(error){
    })
  }

  $scope.enable_qb_sync_cron = function() {
    apiGateWay.send('/enable_qbo_items_sync', { companyId:auth.getSession().companyId, status: true }).then(function(response) {
      if ($rootScope.getCompanyPreferencesGlobal) $rootScope.getCompanyPreferencesGlobal();
    }, function(error){
    })
  }
  // $scope.togglePbItemsSync = function(currentProductAccount, currentRefundAccount){
  //   if(currentProductAccount == '' || currentRefundAccount == '' || currentProductAccount == '--' || currentRefundAccount == '--') {
  //     $scope.invoiceGeneratedError = 'To activate billing sync, an expense account and bank account must be selected';
  //     setTimeout(function(){
  //       $scope.invoiceGeneratedError = '';
  //     }, 2000);
  //     return false;
  //   }
  //   $scope.isProcessing = true;
  //   let url = '/enable_pb_sync';
  //   apiGateWay.send(url, { companyId:auth.getSession().companyId, status: !$scope.isPbItemsSyncEnabled }).then(function(response) {
  //     $scope.isPbItemsSyncEnabled = response.data.data.status;
  //     if(response.data.data.status) {
  //       $scope.enable_pb_sync_cron();
  //     }
  //     $scope.isProcessing = false;
  //   }, function(error){
  //     $scope.isProcessing = false;
  //     $scope.invoiceGeneratedError = error;
  //     setTimeout(function(){
  //       $scope.invoiceGeneratedError = '';
  //     }, 2000);
  //   })
  // }
  // $scope.enable_pb_sync_cron = function() {
  //   apiGateWay.send('/enable_pb_items_sync', { companyId:auth.getSession().companyId, status: true }).then(function(response) {
  //   }, function(error){
  //   })
  // }
  $scope.syncQBOCron = function(){
    $scope.isProcessing = true;
    let url = '/sync_qbo_cron';

    apiGateWay.get(url, {companyId:auth.getSession().companyId, action:'All'}).then(function(response) {
      if ($rootScope.getCompanyPreferencesGlobal) $rootScope.getCompanyPreferencesGlobal();
      if (response.data.status == 200) {
        if (response.data.data) {
          $scope.invoiceGenerated = '(' + response.data.data.totalInvoices + ') Invoices and Payment Synced';
        }
      } else {
        // $scope.invoiceGeneratedError = 'There is some error in invoice syncing'
        $scope.invoiceGeneratedError = ''
      }
      $scope.isProcessing = false;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 5000);
    }, function(error){
      $scope.isProcessing = false;
      $scope.invoiceGeneratedError = error;
      setTimeout(function(){
        $scope.invoiceGenerated = '';
        $scope.invoiceGeneratedError = '';
        if (!$scope.$$phase) $scope.$apply()
      }, 2000);
    })
    $scope.invoiceGenerated = 'Sync is initiated, It may take some time to complete the sync.';
    $scope.isProcessing = false;
    setTimeout(function(){
      $scope.invoiceGenerated = '';
      $scope.invoiceGeneratedError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 5000);
  }

  $scope.scrollServiceLevelTab = '';
  $scope.scrollServiceLevelTab = function (direction)
  {
     var speed=25,distance=100,step=10;
      var element = document.querySelectorAll('.service-tab-chemical')[0];
      var scrollAmount = 0;
      var slideTimer = setInterval(function(){
          if(direction == 'left'){
              element.scrollLeft -= step;
          } else {
              element.scrollLeft += step;
          }
          scrollAmount += step;
          if(scrollAmount >= distance){
              window.clearInterval(slideTimer);
          }
      }, speed);
  }
  var tabUpdateIntervalIns = '';
      $scope.updateTabScroll = function(){
      tabUpdateIntervalIns = setTimeout(function(){
          $scope.tabContainerWidth = 0;
          var ele = document.querySelectorAll('#serviceTab1')[0];
          for (var i = 0; i < angular.element(ele).children().length; i++) {
          $scope.tabContainerWidth += angular.element(ele).children()[i].clientWidth;
          }
          $scope.tabContainerWidth += 1;
          if(window.innerWidth > 1920) {
            $scope.tabContainerWidth += 7;
          }
          $scope.$apply();
      }, 100)
  }
  $scope.$watch('chemicalReadingServiceArray', function (newVal, oldVal) {
    if(newVal){
      $scope.updateTabScroll();
    }
  }, true);
  $scope.clearTabUpdateInterval = function(){
      if(tabUpdateIntervalIns){clearTimeout(tabUpdateIntervalIns);}
  }
  $scope.selectTab = function(tabIndex, force=false){
      if($scope.selectedWaterBody !== tabIndex || force){
          $scope.selectedWaterBody = tabIndex;
          $scope.updateTabScroll();
          $scope.getChecklistByWaterBodyId($scope.waterBodies[tabIndex].id)
          $scope.getGallonsByWaterBodyId($scope.waterBodies[tabIndex].id)
          if (angular.isDefined($rootScope.getEquipmentDetails) && angular.isFunction($rootScope.getEquipmentDetails)) {$rootScope.getEquipmentDetails($scope.waterBodies[tabIndex]);}
          if (angular.isDefined($rootScope.getJobDetailByWaterBody) && angular.isFunction($rootScope.getJobDetailByWaterBody)) {$rootScope.getJobDetailByWaterBody($scope.waterBodies[tabIndex]);}
      }
  }
  /*Tab setting End*/

  $scope.chemicalProductsPopUp = function(chemical){
    $scope.selectedCategoryForFilter = {};
    $scope.chemicalProduct = chemical;
    $scope.bundleSearchForm = false;
    $scope.getSelectedProductMap();
    setTimeout(function() {
      ngDialog.open({
        template: 'chemicalProductsPopUp.html',
        className: 'ngdialog-theme-default',
        scope: $scope
    },1000);
    })
  }

    $scope.getProductList = function() {
      $scope.errorSelectProduct = '';
      $scope.successMessage = '';
      apiGateWay.get("/product_services", {
        // offset: page - 1,
        limit: 99999,
        category: 'Product',
        status: 1,
        chemicalMap: 1
    }).then(function(response) {
        if (response.data.status == 200) {
          $scope.errorSelectProduct = '';
          $scope.allCategories = response.data.data.data;
        }
      },function(error) {
        // $scope.errorSelectProduct = error;
        setTimeout(function(){
          $scope.errorSelectProduct = '';
        },2000)
      });
    }

    $scope.getSelectedProductMap = function() {
      apiGateWay.get("/get_chemicalproduct_mapping", {
        chemicalKey: $scope.chemicalProduct.chemicalKey
         }).then(function(response) {
        if (response.data.status == 200) {
          $scope.selectedCategoryForFilter = response.data.data;
          $scope.getProductList();
          $scope.productBundleList=[];
        }
       });
    }
    $scope.resetCatSearch = function() {
      var inputBox = document.getElementById('filterCatListInput');
      inputBox.value = '';
      ul = document.getElementById("filterCatListUl");
      li = ul.getElementsByTagName('li');
      for (i = 0; i < li.length; i++) {
          li[i].style.display = "";
      }
  }
    $scope.filterCatList = function() {
      var input, filter, ul, li, a, i, txtValue;
      input = document.getElementById('filterCatListInput');
      filter = input.value.toUpperCase();
      ul = document.getElementById("filterCatListUl");
      li = ul.getElementsByTagName('li');
      for (i = 0; i < li.length; i++) {
          a = li[i].getElementsByTagName("a")[0];
          txtValue = a.textContent || a.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
          li[i].style.display = "";
          } else {
          li[i].style.display = "none";
          }
      }
  }

  $scope.filterByCategoryID = function(cat, load = true) {
    $scope.selectedCategoryForFilter = cat;
  }

  $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'chemicalMapping') {        
          $scope.chemicalSettingWithProduct(data);
        }
    }); 
  $scope.chemicalSettingWithProduct = function(productBundleListCategory){
    $scope.bundleSearchForm= false;
    $scope.productBundleListCategory = productBundleListCategory;
    if(productBundleListCategory){
      let params = {
        chemicalKey: $scope.chemicalProduct.chemicalKey,
        ProductName: productBundleListCategory.name
      }
      var apiUrl = "/chemical_product_mapping";
        apiGateWay.send(apiUrl, params).then(function(response) {
            if (response.data.status == 200) {
              $scope.successMessage = response.data.message;
              $scope.searchText = ''
              setTimeout(function(){
                $scope.successMessage = '';
              },2000)
              $scope.getSelectedProductMap();
            }
            else{
              $scope.errorMessage = response.message;
              setTimeout(function(){
                $scope.errorMessage = '';
              },2000)
            }
          },function(error) {
            $scope.errorMessage = error;
            setTimeout(function(){
              $scope.errorMessage = '';
            },2000)
        });
    }
  }

  $scope.addBundleProductSearch = () => {
        $scope.bundleSearchText = "";
        $scope.productBundleList = [];
        $scope.bundleSearchForm = true;
        setTimeout(function(){
            angular.element("#bundleSearchText").focus();
        }, 100);
}

$scope.hideSearchBar = function(){
  if(!$scope.searchText){
      $scope.bundleSearchForm = false;
      $scope.isBundleSearch = false;
  }
  $scope.searchText = "";
}


  $scope.chemicalSettingWithNewProduct = function(){
    // clearInterval(addProductIntervalRef);
    if($scope.searchText){
      $scope.bundleSearchForm= false;
      let params = {
        chemicalKey: $scope.chemicalProduct.chemicalKey,
        ProductName: $scope.searchText
      }
      var apiUrl = "/chemical_product_mapping";
        apiGateWay.send(apiUrl, params).then(function(response) {
            if (response.data.status == 200) {
              $scope.searchText = "";
              $scope.successMessage = response.data.message;
              setTimeout(function(){
                $scope.successMessage = '';
              },2000)
              $scope.getSelectedProductMap();
            }
            else{
              $scope.errorMessage = response.message;
              setTimeout(function(){
                $scope.errorMessage = '';
              },2000)
            }
          },function(error) {
            $scope.errorMessage = error;
            setTimeout(function(){
              $scope.errorMessage = '';
            },2000)
        });
    }
  }

    $scope.currencyTrimmer = function (c) {
      var finalValue = c;
      if (c) {
        c = Number(c);
        finalValue = Number(Math.round(finalValue * 1000) / 1000)
        finalValue = Number(Math.round(finalValue * 100) / 100)
      }
      return finalValue;
    }

    $scope.checkCustomerStatus = function () {
      $scope.isChangingStatus = true;
      apiGateWay.send("/customer/change_status", {'companyId': $scope.companyId}).then(function(response) {
        if (response.status == 200) {
          $scope.isChangingStatus = false;
        }else{
          $scope.isChangingStatusError = response.message;
      }
      $scope.isChangingStatus = false;
    }, function(error) {
      $scope.isChangingStatusError = error;
      $scope.isChangingStatus = false;
      });
    }
    
    $scope.toggleInclude = function(element) {
      if (element == 'reading') {
        if ($scope.includeEmail.includeChemicalReading == 0) {
          $scope.includeEmail.includeChemicalReading = 1
        } else {
          $scope.includeEmail.includeChemicalReading = 0
        }
      }
      
      if(element == 'added') {
        if ($scope.includeEmail.includeChemicalAdded == 0) {
          $scope.includeEmail.includeChemicalAdded = 1
        } else {
          $scope.includeEmail.includeChemicalAdded = 0
        }
      }
      $scope.saveEmailInclude();
    }
    
    $scope.saveEmailInclude = function () {
      $scope.isProcessing = true;
      $rootScope.settingPageLoaders.emailSectionTemplate = true;
      apiGateWay.send("/include_chemical_readings", $scope.includeEmail).then(function(response) {
      //   if (response.status == 200) {
      //     $scope.isChangingStatus = false;
      //   }else{
      //     $scope.isChangingStatusError = response.message;
      // }
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.emailSectionTemplate = false;
    }, function(error) {
      // $scope.isChangingStatusError = error;
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.emailSectionTemplate = false;
      });
    }
    // text on the way settings    
    $scope.textOnTheWayDetails = {
      messageBody: null,
      replyToNumber: null,
      textOnTheWayAction: "1",
      noReplyMessage: null
    }
    $scope.textOnTheWayDetailsCached = {
      messageBody: null,
      replyToNumber: null,
      textOnTheWayAction: "1",
      noReplyMessage: null
    }
    $scope.textOnTheWayDetailsSuccessMsg = '';
    $scope.textOnTheWayDetailsErrorMsg = '';
    $scope.textOnTheWayDetailsLoading = true;
    $scope.getTextOnTheWayDetails = function() {
      $scope.textOnTheWayDetailsLoading = true;
      apiGateWay.get('/company_settings_sms').then(function(response){        
        if (response.data.status == 200) {
          let data = response.data.data;
          $scope.textOnTheWayDetails.messageBody = data && data.messageBody ? data.messageBody : '';
          $scope.textOnTheWayDetails.replyToNumber = data && data.replyToNumber ? data.replyToNumber : '';
          $scope.textOnTheWayDetails.textOnTheWayAction = data && data.textOnTheWayAction ? data.textOnTheWayAction + '' : '1';
          $scope.textOnTheWayDetails.noReplyMessage = data && data.noReplyMessage ? data.noReplyMessage : '';
          $scope.cacheTextOnTheWayDetails();
        }
        $scope.textOnTheWayDetailsLoading = false;
      }, function(error){
        $scope.textOnTheWayDetailsLoading = false;
      })
    }
    $scope.errorMessageMessageBody = '';
    $scope.errorMessageNoReplyMsg = '';
    $scope.resetErrorMessageMessageBody = function() {
      $scope.errorMessageMessageBody = '';
    }
    $scope.resetErrorMessageNoReplyMsg = function() {
      $scope.errorMessageNoReplyMsg = '';
    }
    $scope.saveTextOnTheWayDetails = function() {      
      let payLoad = {
        messageBody: $scope.textOnTheWayDetails.messageBody ? $scope.textOnTheWayDetails.messageBody : '', 
        replyToNumber: $scope.textOnTheWayDetails.replyToNumber ? $scope.textOnTheWayDetails.replyToNumber : '', 
        textOnTheWayAction: $scope.textOnTheWayDetails.textOnTheWayAction ? $scope.textOnTheWayDetails.textOnTheWayAction : '1', 
        noReplyMessage: $scope.textOnTheWayDetails.noReplyMessage ? $scope.textOnTheWayDetails.noReplyMessage : '', 
      }
      // validations
      $scope.errorMessageMessageBody = '';
      $scope.errorMessageNoReplyMsg = '';
      $scope.textOnTheWayDetailsErrorMsg = '';
      let gsmPattern = "@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞ^{}\\[~]|€ÆæßÉ!\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà \r\n";    
      let urlPattern =  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
      if (payLoad.textOnTheWayAction == '1' || payLoad.textOnTheWayAction == '2') {
        if (payLoad.messageBody && payLoad.messageBody !== '') {
          let unsupportedCharacters = [];
            for (let i = 0; i < payLoad.messageBody.length; i++) {
                let char = payLoad.messageBody[i];
                if (gsmPattern.indexOf(char) == -1) {
                    unsupportedCharacters.push(char);
                }
            } 
            if (unsupportedCharacters.length > 0) {
              $scope.errorMessageMessageBody = 'Unsupported character (' + unsupportedCharacters[0] + ') is not allowed';
            }
        }
        if (payLoad.messageBody.length > 105) {
          $scope.errorMessageMessageBody = 'Message body cannot exceed 105 characters.';
        }
        let strArray = payLoad.messageBody.split(/\s+/);
        let urlExist = 0;
        if (strArray && strArray.length > 0) {
          strArray.forEach(function(str){
            str = str.toLowerCase();
            if (str.includes('.') && urlPattern.test(str)) {              
              urlExist++;
            }
          })
        }
        if (urlExist > 0) {
          $scope.errorMessageMessageBody = 'URLs are not allowed';
        }
      }    
      // 
      if (payLoad.textOnTheWayAction == '2') {
        if (payLoad.noReplyMessage && payLoad.noReplyMessage !== '') {
          let unsupportedCharacters2 = [];
            for (let i = 0; i < payLoad.noReplyMessage.length; i++) {
                let char = payLoad.noReplyMessage[i];
                if (gsmPattern.indexOf(char) == -1) {
                  unsupportedCharacters2.push(char);
                }
            } 
            if (unsupportedCharacters2.length > 0) {
              $scope.errorMessageNoReplyMsg = 'Unsupported character (' + unsupportedCharacters2[0] + ') is not allowed';
            }
        }
        if (payLoad.noReplyMessage.length > 160) {
          $scope.errorMessageNoReplyMsg = 'No-Reply message cannot exceed 160 characters.';
        }
        let strArray = payLoad.noReplyMessage.split(/\s+/);
        let urlExist2 = 0;
        if (strArray && strArray.length > 0) {
          strArray.forEach(function(str){
            str = str.toLowerCase();
            if (str.includes('.') && urlPattern.test(str)) {              
              urlExist2++;
            }
          })
        }
        if (urlExist2 > 0) {
          $scope.errorMessageNoReplyMsg = 'URLs are not allowed';
        }
      } 
      //      
      if ($scope.errorMessageMessageBody !== '' || $scope.errorMessageNoReplyMsg !== '') {        
        return;
      }
      // validations
      $scope.textOnTheWayDetailsLoading = true;
      apiGateWay.send('/company_settings_sms', payLoad).then(function(response){        
        if (response.data.status == 200) {
          $scope.textOnTheWayDetailsSuccessMsg = 'Updated';
          $scope.textOnTheWayDetails.messageBody = payLoad.messageBody;
          $scope.textOnTheWayDetails.replyToNumber = payLoad.replyToNumber;
          $scope.textOnTheWayDetails.textOnTheWayAction = payLoad.textOnTheWayAction;
          $scope.textOnTheWayDetails.noReplyMessage = payLoad.noReplyMessage;
          $scope.cacheTextOnTheWayDetails();
          $scope.resetTextOnTheWayDetailsMsg(2000);
        } else {
          $scope.textOnTheWayDetailsErrorMsg = response.data.message ? response.data.message : 'Something went wrong. Please try again.';
          $scope.resetTextOnTheWayDetailsMsg(2000);
        }
        $scope.textOnTheWayDetailsLoading = false;
      }, function(error){
        $scope.textOnTheWayDetailsErrorMsg = typeof error === 'string' ? error : 'Something went wrong. Please try again.';
        $scope.resetTextOnTheWayDetailsMsg(2000);
        $scope.textOnTheWayDetailsLoading = false;
      })
    }
    $scope.resetTextOnTheWayDetailsMsg = function(timeout=0) {
      $timeout(function(){
        $scope.textOnTheWayDetailsSuccessMsg = '';
        $scope.textOnTheWayDetailsErrorMsg = '';
      },timeout)
    }
    $scope.cacheTextOnTheWayDetails = function() {
      $scope.textOnTheWayDetailsCached.messageBody = $scope.textOnTheWayDetails.messageBody;
      $scope.textOnTheWayDetailsCached.replyToNumber = $scope.textOnTheWayDetails.replyToNumber;
      $scope.textOnTheWayDetailsCached.textOnTheWayAction = $scope.textOnTheWayDetails.textOnTheWayAction;
      $scope.textOnTheWayDetailsCached.noReplyMessage = $scope.textOnTheWayDetails.noReplyMessage;
    }
    $scope.isTextOnTheWayDetailsUpdate = function() {
      let change = 
      $scope.textOnTheWayDetailsCached.messageBody == $scope.textOnTheWayDetails.messageBody && 
      $scope.textOnTheWayDetailsCached.replyToNumber == $scope.textOnTheWayDetails.replyToNumber &&
      $scope.textOnTheWayDetailsCached.noReplyMessage == $scope.textOnTheWayDetails.noReplyMessage;
      return !change;
    }
    // text on the way settings
    // helper
    function handleFroalaEventsSettingsPage(selector, eventType, handler) {        
      function checkElementExistenceSettingsPage() {
          const element = document.querySelector(selector);
          if (element) {                
              element.addEventListener(eventType, handler);
          } else {         
              removeEventListenerSettingsPage();
          }
      }
      checkElementExistenceSettingsPage();
      function removeEventListenerSettingsPage() {
          const element = document.querySelector(selector);
          if (element) {
              element.removeEventListenerSettingsPage(eventType, handler);
          }
      }
      const observerSettingsPage = new MutationObserver(checkElementExistenceSettingsPage);
      observerSettingsPage.observe(document.body, { childList: true, subtree: true });
      return function stopObserving() {
          observerSettingsPage.disconnect();
          removeEventListenerSettingsPage();
      };
    }
    function handleFocusSettingsPage(event) {
        let placeHolder = document.querySelector('#emailSettingsPageFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.add('transparent-fr-placeholder')
        }
    }
    function handleBlurSettingsPage(event) {
        let placeHolder = document.querySelector('#emailSettingsPageFroala .fr-placeholder');
        if (placeHolder) {
            placeHolder.classList.remove('transparent-fr-placeholder')
        }
    }
    handleFroalaEventsSettingsPage('#emailSettingsPageFroala .fr-element', 'focus', handleFocusSettingsPage);    
    handleFroalaEventsSettingsPage('#emailSettingsPageFroala .fr-element', 'blur', handleBlurSettingsPage); 
    // helper
    
    /* Heritage Integration */
    $scope.heritageData = {};
    $scope.heritageIntegration = {
      status: 0,
      selectedBranch: 'None',
      customerAccountId: '',
      customerApiKey: ''
    }
    $scope.heritageDataLoading = false;
    $scope.heritageButtonText = "Connect";
    $scope.heritageBranchData = [];
    $scope.successMessageHeritage = '';
    $scope.errorMessageHeritage = '';
    $scope.getHeritageDetails = function() {
      $scope.heritageDataLoading = true;
      apiGateWay.get('/company_heritage_connection', {}).then(function(response){        
        if (response.data.status == 200) {
          $scope.heritageData = response.data.data;
          if ($scope.heritageData && $scope.heritageData.hasOwnProperty("status") && $scope.heritageData.status == 1) {
            $scope.heritageButtonText = "Disconnect";
            $scope.heritageIntegration.customerAccountId = $scope.heritageData.customerAccountId;
            $scope.heritageIntegration.customerApiKey = $scope.heritageData.customerApiKey;
            $scope.heritageIntegration.status = $scope.heritageData.status;
            $scope.getHeritageBranches();
            $scope.updateHeritageStatus();           
          } else {
            $scope.heritageButtonText = "Connect";
            $scope.heritageBranchData = [];
            $scope.heritageIntegration = {
              status: 0,
              selectedBranch: 'None',
              customerAccountId: '',
              customerApiKey: ''
            };
            $scope.updateHeritageStatus();
          }
        }
        $scope.heritageDataLoading = false;
      }, function(_error){
        $scope.heritageDataLoading = false;
      })
    }
    $scope.saveHeritageDetails = function(isConnect) {
      let payload = angular.copy($scope.heritageIntegration);
      // delete unnecessary keys
      delete payload.selectedBranch;
      if (!isConnect) {
        $scope.heritageIntegration.status = payload.status = 0;
        payload.customerAccountId = '';
        payload.customerApiKey = '';
      } else {
        payload.status = 1;
        if (!payload.customerAccountId || !payload.customerApiKey) {
          $scope.errorMessageHeritage = "Please enter Customer Account ID and Customer API Key";
          $scope.hideHeritageMessage(2000);
          return;
        }
      }
      if ($scope.confirmHeritageModal) {
        $scope.confirmHeritageModal.close();
      }
      $scope.heritageDataLoading = true;
      apiGateWay.send('/company_heritage_connection', payload).then(function(response){        
        if (response.data.status == 200) {
          if (!isConnect) {
            $scope.heritageData = {};
            $scope.heritageIntegration = {
              status: 0,
              selectedBranch: 'None',
              customerAccountId: '',
              customerApiKey: ''
            };
            $scope.updateHeritageStatus();
            $scope.heritageBranchData = [];
            $scope.heritageButtonText = "Connect";
            $rootScope.isHeritageEnabled = false;
          } else {
            $scope.heritageButtonText = "Disconnect";
            $rootScope.isHeritageEnabled = true;
            $scope.getHeritageDetails();
            $scope.updateHeritageStatus();
          }
          $scope.successMessageHeritage = response.data.message;
          $scope.hideHeritageMessage(2000);
        } else {
          $scope.heritageData.status = 0;
          $scope.heritageButtonText = "Connect";
          $scope.heritageBranchData = [];
          $scope.heritageIntegration.status = 0;
          $scope.heritageIntegration.customerAccountId = '';
          $scope.heritageIntegration.customerApiKey = '';
          if (isConnect) {
            $scope.errorMessageHeritage = response.data.message;
            $scope.hideHeritageMessage(2000);
          }
        }
        $scope.heritageDataLoading = false;
      }, function(_error){
        $scope.heritageDataLoading = false;
        $scope.errorMessageHeritage = _error;
        $scope.hideHeritageMessage(2000);
      })
    }

    $scope.heritageCronRun = function(isConnect) {
      if (isConnect) {
        $scope.heritageDataLoading = true;
        apiGateWay.send('/heritage_cron_process', {})
        .then(function (response) {
          if (response.status == 200) {
            $scope.successMessageHeritage = 'Heritage CRON started Successfully';
            $scope.hideHeritageMessage(2000);
          } else {
            $scope.errorMessageHeritage = 'Heritage CRON failed to start';
            $scope.hideHeritageMessage(2000);
          }
          $scope.heritageDataLoading = false;
         }, function (_error) { 
          $scope.heritageDataLoading = false;
          $scope.errorMessageHeritage = _error;
          $scope.hideHeritageMessage(2000);
         });
      }
    }
    
    $scope.getHeritageBranches = function() {
      $scope.heritageDataLoading = true;
      apiGateWay.get('/company_heritage_branch', {}).then(function(response){        
        if (response.data.status == 200) {
          if (response.data.data && response.data.data.length > 0) {
          $scope.heritageBranchData = response.data.data;
          $scope.heritageBranchData.unshift({ branchCode: 'None', branchName: 'None', displayName: 'None', shipToSequenceNumber: null });
          if ($scope.heritageBranchData && $scope.heritageBranchData.length > 0) {
            angular.forEach($scope.heritageBranchData, function(branch){  
              if (branch.branchCode == $scope.heritageData.branchCode) {
                $scope.heritageIntegration.selectedBranch = branch.displayName;
              }
            });
          };
          } else {
            $scope.heritageBranchData = [];
          }
        }
        $scope.heritageDataLoading = false;
      }, function(_error){
        $scope.heritageDataLoading = false;
      });
    }
    $scope.selectHeritageBranch = function (selectedBranch) {
      if ($scope.heritageBranchData && $scope.heritageBranchData.length > 0) {
        angular.forEach($scope.heritageBranchData, function (branch) {
          if (branch.branchCode == selectedBranch.branchCode) {
            $scope.heritageIntegration.selectedBranch = branch.displayName;
          }
        });
        if (selectedBranch.branchCode == 'None') {
          $scope.heritageIntegration.selectedBranch = 'None';
        }
        setTimeout(function () {
          $scope.heritageDataLoading = true;
          apiGateWay.send('/company_heritage_branch', { "branchCode": selectedBranch.branchCode != 'None' ? selectedBranch.branchCode : null, "shipToSequenceNumber": selectedBranch.branchCode != 'None' ? selectedBranch.shipToSequenceNumber : null }).then(function (response) {
            if (response.data.status == 200) {
              $scope.successMessageHeritage = response.data.message;
              $scope.hideHeritageMessage(2000);
            }
            $scope.heritageDataLoading = false;
          }, function (_error) {
            $scope.heritageDataLoading = false;
            $scope.errorMessageHeritage = _error;
            $scope.hideHeritageMessage(2000);
          });
        }, 100);
      }
    }
    $scope.hideHeritageMessage = function(timeout=0) {
      $timeout(function(){
        $scope.successMessageHeritage = '';
        $scope.errorMessageHeritage = '';
      },timeout)
    }
    
    $scope.confirmDisconnectHeritage = function() {
      $scope.confirmHeritageModal = ngDialog.open({
        template: 'confirmDisconnect.html',
        className: 'ngdialog-theme-default v-center',
        closeByDocument: true,
        scope: $scope,
        preCloseCallback: null
      });
    }
    $scope.updateHeritageStatus = function() {      
      $rootScope.isHeritageEnabled = $scope.heritageIntegration.status;
      const data = { isHeritageEnabled: $rootScope.isHeritageEnabled, timestamp: Date.now() };
      BroadcastService.sendMessage(data);
    }
    /* Heritage Integration */
});
