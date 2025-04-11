angular.module('POOLAGENCY')


.controller('companyDetailsController', ['$scope', '$rootScope', '$state', '$stateParams', '$filter', 'apiGateWay', 'ngDialog', 'config', 'auth', function($scope, $rootScope, $state, $stateParams, $filter, apiGateWay, ngDialog, config, auth) {

    let session = auth.getSession();
    if (!session.isSuperAdmin) {
      $state.go('app.dashboard');
    }

    var companyId = $stateParams.companyId;
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
    $scope.isSuperAdmin = $rootScope.userSession.userType == 'administrator'?true:false;
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


    // get company details
    $scope.isProcessing = true;
    $scope.companyData = '';
    $scope.paymentHistory =[];
    $scope.getCompanyDetails = function(){
      apiGateWay.get("/administrator/company_details", {companyId: companyId}).then(function(response) {
          $scope.isProcessing = false;
          if(response.data.status == 200){
              var responseData = response.data.data;
              $scope.paymentHistory = responseData.paymentHistory;
              $scope.companyData = responseData.companyInfo;
              $scope.cardInfo = responseData.creditCard;
              if(responseData.creditCard){
                responseData.creditCard['cardNo'] = responseData.creditCard.maskedCard
                if(responseData.creditCard.expiry){
                  var expiry = responseData.creditCard.expiry.split('-');
                  var year = expiry[0];
                  var month = expiry[1];
                  responseData.creditCard['cardNo'] = responseData.creditCard.maskedCard;
                  responseData.creditCard['expMonth'] = month;
                  responseData.creditCard['expYear'] = year.trim().substring(2, 4);
                }
              }
              $scope.companyInfoModel = responseData;
          }
      },function(errorResponse){
          $scope.isProcessing = false;
      });
    }

    $scope.getCompanyDetails();

    $scope.tabType = 'business';
    $scope.openTab = function(tabType){
        $scope.tabType = tabType;
        $scope.cardEdit = false;
    }

    $scope.editCard = function(){
      $scope.cardEdit = true;
    }
    
    $scope.updateCompanyInfo = function(type, companyInfoForm){
        companyInfoForm = companyInfoForm || '';
        
        var model = '';
        if(!$scope.companyInfoModel.billInfo){
          $scope.companyInfoModel.billInfo = {
            companyId: companyId
          }
        }
        $scope.companyInfoModel.billInfo['companyId'] = companyId;

        if(type =='billing'){
            model = {billInfo: $scope.companyInfoModel.billInfo, type: 'billing'};
        }else if(type == 'card'){
            model = {creditCard: $scope.companyInfoModel.creditCard, type: 'card'};
        }else if(type == 'business'){
            model = {business: $scope.companyInfoModel.companyInfo, type: 'business'};
        }
        $scope.isProcessing = true;
        apiGateWay.send("/administrator/company_details?companyId="+companyId, model).then(function(response) {
            $scope.isProcessing = false;
            var messages = response.data.message;
            if(response.data.status == 200){
              $scope.success = messages;
              if(type == 'card'){
                var cardNo = $scope.companyInfoModel.creditCard.cardNo;
                $scope.companyInfoModel.creditCard.cvv = '';
                $scope.companyInfoModel.creditCard.cardNo = "XXXX"+cardNo.substr(cardNo.length - 4)
                $scope.cardEdit = false;
                companyInfoForm.$submitted = false
                $scope.companyInfoForm = companyInfoForm;
                $scope.companyInfoForm.$setPristine();
                if (!$scope.$$phase) $scope.$apply()
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
            $scope.isProcessingCard = false;
            if (!$scope.$$phase) $scope.$apply();
        }, 3000);
        $scope.isProcessing = false;
    }

    // manage company users
    $scope.responseData = [];
    $scope.roles = [];
    $scope.roleValue = {"companymanager":"Admin","servicemanager":"Manager","viewer":"Staff","companyadmin":"Admin"};
    apiGateWay.get("/roles").then(function(response) {
        if (response.data.status == 200) {
            responseData = response.data
            $scope.roles = responseData.data
        } else {
        }
        $scope.isProcessing = false;
    }, function(error) {
    });
    apiGateWay.get("/company/devices", {companyId: companyId}).then(function(response) {
        if (response.data.status == 200) {
            $scope.responseData = response.data
        } else {

        }
    }, function(error) {
    });

    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.getUsersList = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/company/manage_users", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            companyId: companyId
        }).then(function(response) {
            if (response.data.status == 200) {
                var usersListResponse = response.data.data;
                $scope.totalRecord = usersListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.usersList = usersListResponse.data;
            } else {
                $scope.usersList = [];
            }
            $scope.isProcessing = false;
        }, function(error) {

        });
    };


    $scope.changePage = function(pageNumber){
      $scope.currentPage = pageNumber;
      $scope.getUsersList();
    }

    var initModel = {
        email: '',
        firstName: '',
        lastName:'',
        password:'',
        phoneNumber:'',
        profileImage:'',
        role:'',
        userId:'',
        actionType: 'add',
        companyId: companyId
    }

    $scope.model = angular.copy(initModel);

    $scope.addCompanyUser = function(action, data, index){
        data = data || {};
        $scope.model = angular.copy(initModel);
        $scope.successUser = false;
        $scope.errorArr = false;
        $scope.profileImage = '';

        $scope.index = index;
        $scope.model.actionType = 'add';
        $scope.action = action;
        if(data){
          $scope.model = {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              userImage: data.userImage,
              password:'',
              phoneNumber: data.contactNumber,
              profileImage:data.userImage,
              role: data.userRolesKey,
              userId: data.id,
              actionType: action.toLowerCase(),
          }
          $scope.profileImage = data.userImage;
        }

        ngDialog.open({
            template: 'templates/company/userformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {
              $scope.profileImage = '';
            }
        });
    }

    $scope.editUser = function(userObj, index){
      $scope.addCompanyUser('edit', userObj, index)
    }

    $scope.removeProfilePicture = function(){
      $scope.model.profileImage = '';
      $scope.profileImage = '';
    }
    $scope.browseImage = function() {
        document.getElementById('profileImage').click();
    };
    $scope.profileImage = '';

    $scope.uploadFile = function() {
        var imageData = $scope.model.profileImage;
        $scope.profileImage = 'data:image/png;base64,' + imageData.base64;

    };

    $scope.closeModal = function(){
        ngDialog.close();
    }
    $scope.addOrUpdateUser = function(){
        $scope.resetProcess();
        $scope.isProcessing = true;
        $scope.successUser = false;
        $scope.errorArr = false;
        $scope.model['companyId'] = companyId;
        $scope.model.userImage = $scope.profileImage;
        apiGateWay.send("/company/manage_users", $scope.model).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : '';
            if (responseData.status == 201) {
              $scope.successUser = message;
              $scope.closeModal();
              $scope.getUsersList();
              updateManagers();
            }else{
              $scope.errorArr = message;
            }
            $scope.resetProcess();
            $scope.isProcessing = false;
        },function(errorResponse){
            $scope.errorArr = errorResponse;
            $scope.resetProcess();
            $scope.isProcessing = false;
        });
    }

    $scope.setStatus = function(userId, status){
      $scope.isProcessingStatus = true;
      var model = {"isActive": status ? 0 : 1, "userId": userId, "companyId": companyId}
      apiGateWay.send("/company/user_status", model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 201) {
            $scope.successUser = message;
            $scope.closeModal();
            $scope.getUsersList();
            updateManagers();
          }else{
            $scope.errorArr = message;
          }
          $scope.resetProcess();
          $scope.isProcessingStatus = false;
      },function(errorResponse){
          $scope.errorArr = errorResponse;
          $scope.resetProcess();
          $scope.isProcessingStatus = false;
      });
    }


    $scope.resetProcess = function(){
      setTimeout(function(){
        $scope.successMsg2 = false;
        $scope.successUser = false;
        $scope.success = false;
        $scope.error = false;
        if (!$scope.$$phase) $scope.$apply();
      }, 2000);
      $scope.isProcessing = false;
      $scope.isProcessingStatus = false;
    }


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

    var cardMode = {
        cardNo: '',
        expMonth: '',
        expYear: '',
        cvv: '',

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
                'cardNumber': cardModel.cardNo,
                'month': cardModel.expMonth,
                'year': cardModel.expYear,
                'cardCode': cardModel.cvv
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
          // var _self = this;
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
                  $scope.cardError = errors;
                  $scope.isProcessingCard = false;
                  resetMessages();
              } else {
                  $scope.error = "";
                  // $scope.signupForm.creditCard = {};
                  if(response.opaqueData)
                  {
                      $scope.cardModel.dataDescriptor = response.opaqueData.dataDescriptor;
                      $scope.cardModel.dataValue = response.opaqueData.dataValue;
                      $scope.cardModel.companyId = companyId
                      $scope.saveCardDetails();
                  }
              }
          });
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


    var updateManagers = function(){
      $rootScope.socket.emit("refreshManagerListFromAdmin", {companyId: companyId});
    }


}]);
