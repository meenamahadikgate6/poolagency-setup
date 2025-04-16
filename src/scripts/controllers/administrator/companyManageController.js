angular.module('POOLAGENCY')


.controller('companyManageController', function($rootScope,$scope, $state, $filter, apiGateWay, ngDialog, auth) {

    let session = auth.getSession();
    if (!session.isSuperAdmin) {
      $state.go('app.dashboard');
    }
    

    $scope.model = {
      actionType: 'add',
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      companyWebsite: '',
      companyAddress: '',
      companyCity: '',
      companyState: '',
      companyZipcode: '',
      password: '',
      cpassword: ''
    }

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

    $scope.offset = 0;
    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.companyList = [];
    $scope.searchKey = '';
    $scope.getCompanyList = function(){
        $scope.isProcessing = true;
        apiGateWay.get("/administrator/company", {offset: $scope.currentPage - 1, limit: $scope.limit, searchKey: $scope.searchKey}).then(function(response) {
            var responseData = response.data;
            if (responseData.status == 200) {
              var responseResult = responseData.data;
              $scope.totalRecord = responseResult.total;
              $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
              $scope.isProcessing = false;
              $scope.companyList = responseResult.result;
            }else{
              $scope.isProcessing = false;
            }
            $scope.resetProcess();
        },function(errorResponse){
            //$scope.error = errorResponse;
            $scope.isProcessing = false;
        });
    }

    $scope.changePage = function(pageNumber){
      $scope.currentPage = pageNumber;
      $scope.getCompanyList();
    }

    $scope.searchCompanyByName = function(searchKey){
      $scope.currentPage = 1;
      $scope.searchKey = searchKey;
      $scope.getCompanyList();
    }

    $scope.addCompany = function(action, data, index){
        data = data || {};
        $scope.index = index;
        $scope.model.actionType = 'add';
        $scope.action = action;
        if(data){
            $scope.model = {
              actionType: action.toLowerCase(),
              companyId: data.companyId,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phoneNumber: data.phoneNumber,
              companyName: data.companyName,
              companyWebsite: data.website,
              companyEmail: data.businessEmail,
              companyPhoneNumber: data.companyPhoneNumber,
              companyAddress: data.address,
              companyCity: data.city,
              companyState: data.state,
              companyZipcode: data.zipcode,
              password: '',
              cpassword: ''
            }
        }

        ngDialog.open({
            template: 'templates/administrator/companyformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {

            }
        });
    }

    $scope.closeModal = function(){
      ngDialog.close();
    }

    $scope.isProcessing = false;
    $scope.createOrupdateCompany = function(){
      $scope.success = false;
      $scope.error = false;
      $scope.isProcessing = true;
      apiGateWay.send("/administrator/company", $scope.model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 200) {
            if(typeof $scope.index != 'undefined'){
                $scope.companyList[$scope.index].address = $scope.model.companyAddress;
                $scope.companyList[$scope.index].city = $scope.model.companyCity;
                $scope.companyList[$scope.index].state = $scope.model.companyState;
                $scope.companyList[$scope.index].zipcode = $scope.model.companyZipcode;
                $scope.companyList[$scope.index].companyName = $scope.model.companyName;
                $scope.companyList[$scope.index].phoneNumber = $scope.model.companyPhoneNumber;
                $scope.companyList[$scope.index].website = $scope.model.companyWebsite;
                $scope.companyList[$scope.index].firstName = $scope.model.firstName;
                $scope.companyList[$scope.index].lastName = $scope.model.lastName;

            }else{
              $scope.getCompanyList();
            }
            $scope.success = message;
            $scope.closeModal();
          }else{
            $scope.responseData = message;
          }
          $scope.resetProcess();
      },function(errorResponse){
          $scope.error = errorResponse;
          $scope.resetProcess();
      });
    }

    $scope.changeStatus = function(object, index){
      var model = {"status": object.status ? 0 : 1, "companyId": object.companyId, "actionType": 'edit'}
      $scope.isProcessing = true;
      apiGateWay.send("/administrator/company", model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 200) {
            $scope.companyList[index].status = model['status'];
            $scope.addOneTimeCompanySystemTemplate();
          }
          $scope.success = message;
          $scope.resetProcess();
      }, function(error){
          $scope.error = error;
          $scope.resetProcess();
      })

    }

    $scope.resetProcess = function(){
      setTimeout(function(){
        $scope.success = false;
        $scope.error = false;
        if (!$scope.$$phase) $scope.$apply()
      }, 2000);
      $scope.isProcessing = false;
    }

    $scope.addOneTimeCompanySystemTemplate = function(){
      apiGateWay.get("/add_one_time_company_system_template").then(function (res) {
      });
    }

    $scope.companyContract = function(companyObject){
      $scope.isProcessing = true;
      apiGateWay.send("/administrator/contract", {companyId: companyObject.companyId}).then(function(response) {
        var responseData = response.data;
        var message = responseData && responseData.message ? responseData.message : '';
        if (responseData.status == 200) {
            setTimeout(function(){
              $scope.companyContractContent = responseData.data;
              $scope.companyObject = companyObject;
              ngDialog.open({
                  template: 'contract.html',
                  className: 'ngdialog-theme-default',
                  scope: $scope,
                  closeByDocument: false,
                  preCloseCallback: function() {
                    $scope.companyContractContent = '';
                    $scope.companyObject = '';
                  }
              });
              $scope.isProcessing = false;
              $scope.resetProcess();
            }, 3000);
        }else{
          $scope.error = message;
          $scope.isProcessing = false;
          $scope.resetProcess();
        }

      }, function(error){
          var msg = '';
          if (typeof error == 'object' && error.data && error.data.message) {
              msg = error.data.message;
          } else {
              msg = error;
          }
          $scope.error = msg;
          $scope.resetProcess();
          $scope.isProcessing = false;
      })
    }
    $scope.priceModel = {
      pricePerTech_: []
    }
    $scope.initPriceModel = function(index, companyObj){
      if(typeof $scope.priceModel.pricePerTech_[index] == 'undefined'){
        $scope.priceModel.pricePerTech_[index] = '';
      }
      $scope.priceModel.pricePerTech_[index] = companyObj.pricePerTech
    }


    $scope.updateTechPrice = function(price, companyObj, index){
        $scope.isProcessing = true;
        var companyId = companyObj.companyId;
        if(price && companyId){
            apiGateWay.send("/administrator/company_tech_price", {companyId: companyId, pricePerTech: price}).then(function(response) {
                var responseData = response.data;
                var message = responseData && responseData.message ? responseData.message : '';
                $scope.success = message;
                $scope.companyList[index].pricePerTech = price;
                $scope.resetProcess();
            }, function(error){
                $scope.error = error;
                $scope.resetProcess();
            })
        }else{
          $scope.resetProcess();
        }
    }




});
