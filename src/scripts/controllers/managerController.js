angular.module('POOLAGENCY').controller('managerController', function($scope, $rootScope, auth, $filter, $sce, apiGateWay, service, ngDialog, Analytics, config) {

    $scope.isProcessing = false;
    $scope.successMsg = '';
    $scope.myCroppedImage = '';
    $scope.cropperType= "circle";
    $scope.errorArr = [];
    $scope.imageUpdated = false;
    var sesData = auth.getSession();
    var userId = sesData.id;

    $scope.loggedInRole = auth.loggedInRole();

    $scope.showForm = false;
    $scope.editManager = function() {
        $scope.getProfile();
        $scope.showForm = true;
    };
    $scope.browseImage = function() {
        document.getElementById('image').value = '';
        document.getElementById('image').click();
    };
    $scope.uploadFile = function(event) {

        var imageData = event.userImage.image;
        if(imageData.filename){
          if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
              $scope.myimage  = 'data:image/png;base64,' + imageData.base64;
              ngDialog.open({
                template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                scope: $scope,
                preCloseCallback: function (data) {
                    //if (!(data == 'close' && data == '$closeButton')) {
                        if (data != 'close') {
                            $scope.myimage = $scope.managerModel.userImage = data;

                        }else{
                            $scope.myimage = $scope.managerModel.userImage;
                        }
                }
            });
          }else{
              $scope.myimage = "";
              $scope.error = "Please select image format in JPEG PNG and GIF.";
              resetMessages();
          }
        }
    };


    $scope.isPassShow = false;
    $scope.togglePass = function(){

        $scope.isPassShow = !$scope.isPassShow;
        if($scope.isPassShow == false)
        {
            $scope.managerModel.opassword = '';
            $scope.managerModel.password = '';
            $scope.managerModel.cpassword = '';
        }
    }
    //to save login user profile detail
    $scope.saveManager = function(managerForm) {
        if (managerForm.$valid) {
            $scope.isProcessing = true;
            var managerModel = $scope.managerModel;
           if($scope.myimage){
                managerModel.userImage = $scope.myimage;
           } else {
                managerModel.userImage = $scope.oldUserImage;
           }
         
           

            apiGateWay.send("/users", managerModel).then(function(response) {
                if (response.data) {
                    if (response.data.status == 201) {      
                        $scope.getCompanyDetails();                  
                        resetMessages()
                        $scope.isProcessing = false;


                        var responseData = response.data.data;
                        var session = auth.getSession();
                        session['firstName'] = responseData['firstName']
                        session['lastName'] = responseData['lastName']
                        session['contactNumber'] = responseData['contactNumber']
                        session['userImage'] = responseData['userImage']
                        $scope.oldUserImage = session['userImage'];
                        
                        auth.setSession(session);
                        $rootScope.userSession = session;
                        $scope.successMsg = response.data.message;
                        $scope.updateManagers();
                        //$scope.getProfile();
                        $scope.showForm = false;
                        setTimeout(function() {
                            $scope.successMsg = '';
                            $scope.isPassShow = false;
                        }, 1000);
                        $scope.error = '';
                        var analyticsData = {};
                        analyticsData.userData = $rootScope.userSession;
                        analyticsData.data = managerModel;
                        delete analyticsData.data.userImage;
                        analyticsData.actionTime = new Date();
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('Manager Profile', "Update Profile ", analyticsDataString + " - " + currentDateTime, 0, true);
                        
                    } else {
                        $scope.isProcessing = false;
                        $scope.successMsg = '';
                        $scope.error = response.data.message;
                        setTimeout(function() {
                            $scope.error = '';

                        }, 2000);
                        var analyticsData = {};
                        analyticsData.requestData = managerModel;
                        analyticsData.userData = $rootScope.userSession;
                        analyticsData.actionTime = new Date();
                        analyticsData.errorData = response.data;
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('Error - Update Manager Profile', "Error on saveManager - " + currentDateTime, analyticsDataString, 0, true);
                        resetMessages()
                    }
                }
                $scope.isProcessing = false;
            }, function(error) {
                $scope.isProcessing = false;
                var msg = 'Error';
                if (typeof error == 'object' && error.data && error.data.message) {
                    msg = error.data.message;
                } else {
                    msg = error;
                }
                $scope.successMsg = '';
                $scope.error = msg;
                var analyticsData = {};
                analyticsData.requestData = managerModel;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Update Manager Profile', "Error on saveManager - " + currentDateTime, analyticsDataString, 0, true);
                setTimeout(function() {
                    $scope.error = '';

                }, 2000);
                resetMessages()
            });
        }
    };
    $scope.myimage = "";
    //to get login user detail
    $scope.getProfile = function() {
        $scope.managerModel = auth.getSession();
        $scope.oldUserImage =  $scope.managerModel.userImage;
        $scope.myimage = "";

    };
    $scope.closeForm = function() {
        $scope.getProfile();
        if($scope.isPassShow == true)
        {
            $scope.togglePass();
        }

        $scope.showForm = false;
    };

    $scope.stateList = [
        { value: 'Alabama' , key:'AL'},
        { value: 'Alaska' , key:'AK'},
        { value: 'Arizona' , key:'AZ'},
        { value: 'Arkansas' , key:'AR'},
        { value: 'California' , key:'CA'},
        { value: 'Colorado' , key:'CO'},
        { value: 'Connecticut' , key:'CT'},
        { value: 'Delaware' , key:'DE'},
        { value: 'Florida' , key:'FL'},
        { value: 'Georgia' , key:'GA'},
        { value: 'Hawaii' , key:'HI'},
        { value: 'Idaho' , key:'ID'},
        { value: 'Illinois' , key:'IL'},
        { value: 'Indiana' , key:'IN'},
        { value: 'Iowa' , key:'IA'},
        { value: 'Kansas' , key:'KS'},
        { value: 'Kentucky' , key:'KY'},
        { value: 'Louisiana' , key:'LA'},
        { value: 'Maine' , key:'ME'},
        { value: 'Maryland' , key:'MD'},
        { value: 'Massachusetts' , key:'MA'},
        { value: 'Michigan' , key:'MI'},
        { value: 'Minnesota' , key:'MN'},
        { value: 'Mississippi' , key:'MS'},
        { value: 'Missouri' , key:'MO'},
        { value: 'Montana' , key:'MT'},
        { value: 'Nebraska' , key:'NE'},
        { value: 'Nevada' , key:'NV'},
        { value: 'New Hampshire' , key:'NH'},
        { value: 'New Jersey' , key:'NJ'},
        { value: 'New Mexico' , key:'NM'},
        { value: 'New York' , key:'NY'},
        { value: 'North Carolina' , key:'NC'},
        { value: 'North Dakota' , key:'ND'},
        { value: 'Ohio' , key:'OH'},
        { value: 'Oklahoma' , key:'OK'},
        { value: 'Oregon' , key:'OR'},
        { value: 'Pennsylvania' , key:'PA'},
        { value: 'Rhode Island' , key:'RI'},
        { value: 'South Carolina' , key:'SC'},
        { value: 'South Dakota' , key:'SD'},
        { value: 'Tennessee' , key:'TN'},
        { value: 'Texas' , key:'TX'},
        { value: 'Utah' , key:'UT'},
        { value: 'Vermont' , key:'VT'},
        { value: 'Virginia' , key:'VA'},
        { value: 'Washington' , key:'WA'},
        { value: 'West Virginia' , key:'WV'},
        { value: 'Wisconsin' , key:'WI'},
        { value: 'Wyoming' , key:'WY'}
    
      ];
    $scope.expmonthList = [
        {key:'01',value:'January'},
        {key:'02',value:'February'},
        {key:'03',value:'March'},
        {key:'04',value:'April'},
        {key:'05',value:'May'},
        {key:'06',value:'June'},
        {key:'07',value:'July'},
        {key:'08',value:'August'},
        {key:'09',value:'September'},
        {key:'10',value:'October'},
        {key:'11',value:'November'},
        {key:'12',value:'December'},
    ];

    var currentDate = new Date();
    var currentYear = currentDate.getFullYear()
    $scope.expyearList = [];
    for(var i = 0; i < 20; i++){
      var fullYear = currentYear + i;
      var year = fullYear.toString().slice(-2);
      $scope.expyearList.push({key:year, value: fullYear})
    }

    $scope.tabType = 'business';
    $scope.openTab = function(tabType){
        $scope.tabType = tabType;
        $scope.cardEdit = false;
    }

    $scope.getCompanyDetails = function(){
        // get company details
        $scope.isProcessing = true;
        $scope.companyData = '';
        $scope.paymentHistory =[];
        apiGateWay.get("/administrator/company_details").then(function(response) {
            $scope.isProcessing = false;
            if(response.data.status == 200){
                var responseData = response.data.data;
                $scope.paymentHistory = responseData.paymentHistory;
                $scope.companyData = responseData.companyInfo;              
                $scope.cardInfo = responseData.creditCard;
                $scope.companyInfoModel = responseData;
                if($scope.companyInfoModel['companyInfo'].domain){
                    var subDomain  = $scope.companyInfoModel['companyInfo'].domain.split('.')
                    $scope.companyInfoModel['companyInfo'].domain = subDomain[0]                   
                }
            }
        },function(errorResponse){
            $scope.isProcessing = false;
        });
    }
    $scope.getCompanyDetails();

    $scope.model = {
        defaultCard: 0,
        selectedDefault: 0
    }

    $scope.checkDefaultCard = function(cardObj){
        if(cardObj.isDefault){
            $scope.model.defaultCard = cardObj.id;
            $scope.model.selectedDefault = cardObj.id;
        }
    }

    $scope.changeDefaultCard = function(cardData){
        $scope.model.selectedDefault = cardData.id;
    }

    $scope.setCardAsDefault = function(cardId){
        $scope.isProcessing = true;
        apiGateWay.send("/company/set_default_card", {cardId: cardId}).then(function(response) {
            $scope.isProcessing = false;
            var messages = response.data.message;
            if(response.data.status == 200){
                $scope.model.defaultCard = cardId;
                $scope.success = messages;
            }else{
                $scope.error = messages;
            }
            resetMessages();
        }, function(error){
          $scope.error = error;
          $scope.isProcessing = false;
          resetMessages();
        });
    }

    var cardMode = {
        cardNo: '',
        expMonth: '',
        expYear: '',
        cvv: ''
    }
    $scope.cardModel = angular.copy(cardMode);

    $scope.addNewCard = function(){
        $scope.cardModel = angular.copy(cardMode);
        ngDialog.open({
            template: 'templates/creditcard.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            closeByDocument: false,
            scope: $scope,
            preCloseCallback: function() {
              $scope.cardModel = angular.copy(cardMode);
            }
        });
    }

    $scope.validateCardNumber = function(){
      $scope.cardModel.cardNo = $scope.cardModel.cardNo.replace(' ', '').replace('-', '');
    }


    var closeModal = function(){
      ngDialog.close();
    }

    $scope.saveCard = function() {
        $scope.isProcessingCard = true;
        $scope.success = '';
        $scope.error = '';

        cardModel = $scope.cardModel;

          var secureData= {
            ts: new Date().getTime(),
            cardData: {
                cardNumber: cardModel.cardNo,
                month: cardModel.expMonth,
                year: cardModel.expYear,
                cardCode: cardModel.cvv
              }
          };
          // The Authorize.Net Client Key is used in place of the traditional Transaction Key. The Transaction Key
          // is a shared secret and must never be exposed. The Client Key is a public key suitable for use where
          // someone outside the merchant might see it.
          var authData = {
            clientKey: config.currentEnvironment['authorizeClientKey'],
            apiLoginID: config.currentEnvironment['authorizeApiLoginId']
          }
          secureData['authData'] = authData;
          var _self = this;
          // Pass the card number and expiration date to Accept.js for submission to Authorize.Net.

          Accept.dispatchData(secureData, function(response) {
              if (response.messages.resultCode === "Error") {
                  var errors = "";
                  var code = "";
                  for (var i = 0; i < response.messages.message.length; i++) {
                      errors = response.messages.message[i].text;
                      code= response.messages.message[i].code;
                  }
                  if (code != "E_WC_14")
                  {
                      if(code == 'E_WC_03')
                      {
                          errors = "Some issue occurred from the payment server.Please reload the page and try again.";
                      }
                  }
                  $scope.cardError = errors
                  $scope.isProcessingCard = false;
                  resetMessages()
              } else {
                  $scope.error = "";
                  // $scope.signupForm.creditCard = {};
                  if(response['opaqueData'])
                  {
                      $scope.cardModel.dataDescriptor = response['opaqueData']['dataDescriptor'];
                      $scope.cardModel.dataValue = response['opaqueData']['dataValue'];
                      $scope.saveCardDetails();
                  }
              }
          });
    }


    $scope.saveCardDetails = function(){
        apiGateWay.send("/company/save_credit_card", $scope.cardModel).then(function(response) {
            $scope.isProcessingCard = false;
            var messages = response.data.message;
            if(response.data.status == 200){
              $scope.success = messages;
              $scope.getCompanyDetails();
              closeModal();
            }else{
              $scope.cardError = messages;
            }
            $scope.isProcessingCard = false;
            resetMessages()
        }, function(error){
          $scope.cardError = error;
          $scope.isProcessingCard = false;
          resetMessages()
        });
    }


    $scope.updateCompanyInfo = function(type){
        
        var model = '';
        if(type =='billing'){
            model = {billInfo: $scope.companyInfoModel.billInfo, type: 'billing'}
        }else if(type == 'card'){
            model = {creditCard: $scope.companyInfoModel.creditCard, type: 'card'}
        }else if(type == 'business'){
            model = {business: $scope.companyInfoModel.companyInfo, billInfo: $scope.companyInfoModel.billInfo, type: 'business'}            
        }
        $scope.isProcessing = true;
        apiGateWay.send("/administrator/company_details", model).then(function(response) {
            $scope.isProcessing = false;
            var messages = response.data.message;
            if(response.data.status == 200){
                // update compLatLong
                var _existingSessionData = auth.getSession();
                if (response.data.data && response.data.data.compLatLong && response.data.data.compLatLong != '' && response.data.data.compLatLong != ',') {
                    _existingSessionData.compLatLong = response.data.data.compLatLong // put cords here
                }
                auth.setSession(_existingSessionData)
                $rootScope.userSession = auth.getSession();
                // update compLatLong             
              $scope.success = messages;
              if(type == 'card'){
                var cardNo = $scope.companyInfoModel.creditCard.cardNo;
                $scope.companyInfoModel.creditCard.cvv = '';
                $scope.companyInfoModel.creditCard.cardNo = "XXXX"+cardNo.substr(cardNo.length - 4)
                $scope.cardEdit = false;
                $scope.companyInfoForm.$setPristine();
              }
            }else{
              $scope.error = messages;
            }
            $scope.isProcessing = false;
            resetMessages()
        }, function(error){
          $scope.error = error;
          $scope.isProcessing = false;
          resetMessages()
        });
    }
    
    var resetMessages = function(){
        setTimeout(function(){
            $scope.success = false;
            $scope.error = false;
            $scope.cardError = false;
        }, 2000);
        $scope.isProcessing = false;
        $scope.isProcessingCard = false;
    }
    $scope.removeProfilePicture = function(){
        $scope.managerModel.userImage = '';
        $scope.oldUserImage = '';
        $scope.imageUpdated = true;
        if (!$scope.$$phase) $scope.$apply()
      }
      $scope.updateManagers = function(){
        $rootScope.socket.emit("refreshManagerList");
      }


});
