angular.module('POOLAGENCY')


.controller('companyController', function($scope, $state, $filter, apiGateWay, ngDialog) {

    $scope.model = {
      actionType: 'add',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      companyName: '',
      companyWebsite: '',
      companyEmail: '',
      companyPhoneNumber: '',
      companyAddress: '',
      companyCity: '',
      companyState: '',
      companyZipcode: '',
      password: '',
      cpassword: ''
    }

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
                $scope.companyList[$scope.index].businessEmail = $scope.model.companyEmail;
                $scope.companyList[$scope.index].companyName = $scope.model.companyName;
                $scope.companyList[$scope.index].phoneNumber = $scope.model.companyPhoneNumber;
                $scope.companyList[$scope.index].website = $scope.model.companyWebsite;
                $scope.companyList[$scope.index].firstName = $scope.model.firstName;
                $scope.companyList[$scope.index].lastName = $scope.model.lastName;
                $scope.companyList[$scope.index].firstName = $scope.model.companyAddress;
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
      if (!$scope.$$phase) $scope.$apply();
      apiGateWay.send("/administrator/company", model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 200) {
            $scope.companyList[index].status = model['status'];
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
      }, 2000);
      $scope.isProcessing = false;
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
    $scope.model = {
      pricePerTech_: []
    }
    $scope.initPriceModel = function(index, companyObj){
      if(typeof $scope.model.pricePerTech_[index] == 'undefined'){
        $scope.model.pricePerTech_[index] = '';
      }
      $scope.model.pricePerTech_[index] = companyObj.pricePerTech
    }


    $scope.updateTechPrice = function(price, companyObj){
        var companyId = companyObj.companyId
        $scope.isProcessing = true;
        if(price && companyId){
            apiGateWay.send("/administrator/company_tech_price", {companyId: companyId, pricePerTech: price}).then(function(response) {
                var responseData = response.data;
                var message = responseData && responseData.message ? responseData.message : '';
                $scope.success = message;
                $scope.resetProcess();
            }, function(error){
                $scope.error = error;
                $scope.resetProcess();
            })
        }
    }


});
