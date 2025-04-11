angular.module('POOLAGENCY')


.controller('deviceController', function($rootScope,$scope, $state, $filter, apiGateWay, auth, ngDialog) {
    $scope.model = {
      actionType: 'add',
      deviceName: '',
      deviceSerialNo:'',
    }

    $scope.loggedInRole = auth.loggedInRole();

    $scope.offset = 0;
    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.requestedDeviceCurrentPage = 1;
    $scope.deviceList = [];
    $scope.filterStatus = 'all';
    $scope.searchKey = '';
    $scope.getDeivceList = function(){
        $scope.isProcessingDevice = true;
        var model = {
          offset: $scope.currentPage - 1,
          limit: $scope.limit,
          searchKey: $scope.searchKey
        }
        if($scope.filterStatus!= 'all'){
          model.status = $scope.filterStatus;
        }
        apiGateWay.get("/administrator/device", model).then(function(response) {
            var responseData = response.data;
            if (responseData.status == 200) {
              var responseResult = responseData.data;
              $scope.totalRecord = responseResult.total;
              $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
              $scope.isProcessingDevice = false;
              $scope.deviceList = responseResult.result;
            }else{
              $scope.isProcessingDevice = false;
            }
            $scope.resetProcess();
        },function(errorResponse){
            //$scope.error = errorResponse;
            $scope.isProcessingDevice = false;
        });
    }


    var getAllActiveDeviceList = function(){
      apiGateWay.get("/administrator/device", {offshore: 0, limit: 500, status: 'allActive'}).then(function(response) {
          var responseData = response.data;
          if (responseData.status == 200) {
            var responseResult = responseData.data;
            $scope.deviceListFiltered = responseResult.result;
          }else{
            $scope.isProcessingDevice = false;
          }
          $scope.resetProcess();
      },function(errorResponse){
          //$scope.error = errorResponse;
          $scope.isProcessingDevice = false;
      });
    }
    getAllActiveDeviceList();

    $scope.filterByStatus = function(filterStatus){
        $scope.filterStatus = filterStatus;
        $scope.currentPage = 1;
        $scope.limit = 10;
        setTimeout(function(){
            $scope.getDeivceList()
        }, 500);
    }

    $scope.searchDeviceByKey = function(searchKey){
        $scope.currentPage = 1;
        $scope.limit = 10;
        $scope.searchKey = searchKey;
        setTimeout(function(){
            $scope.getDeivceList()
        }, 500);
    }

    $scope.requestedDevice = [];

    $scope.getRequestedDevices = function(){
      var model = {
          offset: $scope.requestedDeviceCurrentPage - 1,
          limit: $scope.limit,
          role: $scope.loggedInRole
        }
        $scope.isProcessing = true;
        apiGateWay.get("/company/request_device",model).then(function(response) {
          var responseData = response.data;
          if (responseData.status == 200) {
              $scope.requestedDevice = responseData.data.data;
              $scope.requestedDeviceTotalRecord = responseData.data.rows;
              $scope.requestedDeviceTotalPage = ($scope.requestedDeviceTotalRecord % $scope.limit) !== 0 ? parseInt($scope.requestedDeviceTotalRecord / $scope.limit) : parseInt(($scope.requestedDeviceTotalRecord / $scope.limit)) - 1;
          }else{
              $scope.requestedDevice = [];
          }
          $scope.resetProcess();
        }, function(error){
            $scope.isProcessing = false;
            $scope.requestedDevice = [];
        });
    }

    $scope.getRequestedDevices();


    $scope.changePage = function(pageNumber,type){
      type = type||'device';
      if(type == 'requestDevice')
      {
        $scope.requestedDeviceCurrentPage = pageNumber;
         $scope.getRequestedDevices();
      }else{
        $scope.currentPage = pageNumber;
        $scope.getDeivceList();
      }
    }

    $scope.addDevice = function(action, data){
        data = data || {};
        $scope.action = action;
        if(action=='Add'){
            $scope.model = {
              actionType: 'add',
              deviceSerialNo: $scope.uid(10)
            };
        }else{
          $scope.model = {
          actionType: 'edit',
          deviceName: data.deviceName,
          deviceSerialNo: data.deviceSerialNo,
          deviceId: data.deviceId
          };
        }
        ngDialog.open({
            template: 'templates/administrator/deviceformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
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
    $scope.createOrupdateDevice = function(){
      $scope.successDevice = false;
      $scope.errorDevice = false;
      $scope.isProcessingDeviceUpdate = true;

      apiGateWay.send("/administrator/device", $scope.model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 200) {
            $scope.successDevice = message;
            $scope.closeModal();
            $scope.getDeivceList();
          }else{
            $scope.responseData = message;
          }
          $scope.resetProcess();
      },function(errorResponse){
          $scope.errorDevice = errorResponse;
          $scope.resetProcess();
      });
    }



    $scope.resetProcess = function(){
      setTimeout(function(){
        $scope.success = false;
        $scope.error = false;
        $scope.successDevice = false;
        $scope.errorDevice = false;
        if (!$scope.$$phase) $scope.$apply();
      }, 2000);
      $scope.isProcessingDevice = false;
      $scope.isProcessing = false;
      $scope.isProcessingRequestDevice = false;
      $scope.isProcessingDeviceReject = false;
      $scope.isProcessingDeviceUpdate = false;
    }

    $scope.ran_no = function ( min, max ){
      return Math.floor( Math.random() * ( max - min + 1 )) + min;
    }
  //Method to generate random ID of any length
  $scope.uid = function (len){
    var str     = '';
    var src     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var src_len = src.length;
    var i       = len;

    for( ; i-- ; ){
      str += src.charAt( $scope.ran_no( 0, src_len - 1 ));
    }

    return str;
  }

  $scope.requestModel = {
      requestReason: "new",
      deviceobj: ''
  }


  $scope.onSelect = function(){
      deviceobj = angular.copy($scope.requestModel.deviceobj);
      if(typeof deviceobj == 'string'){
        deviceobj = JSON.parse(deviceobj);
      }
      $scope.deviceObj = deviceobj;
  }

    $scope.saveRequestDevice = function(requestReason, deviceCompMapId){
          var requestReason = $scope.requestModel.requestReason;
          var deviceCompMapId = '';
          if(requestReason == 'replacement'){
              var deviceobj = $scope.requestModel.deviceobj;
              if(typeof deviceobj == 'string'){
                deviceobj = JSON.parse(deviceobj);
              }
              deviceCompMapId = deviceobj.deviceCompMapId;
          }

          $scope.isProcessingRequestDevice = true;
          var data = {"requestReason": requestReason, deviceCompMapId: deviceCompMapId}
          $scope.errorDevice = false;

          apiGateWay.send("/company/request_device", data).then(function(response) {
              var responseData = response.data;
              var message = responseData && responseData.message ? responseData.message : '';
              if (responseData.status == 201) {
                $scope.success = message;
                $scope.getRequestedDevices()
                getAllActiveDeviceList();
                $scope.closeModal();
              }else{
                $scope.errorDevice = message;
                $scope.resetProcess();
              }
          },function(errorResponse){
              $scope.errorDevice = errorResponse;
              $scope.resetProcess();
          });

  }

$scope.requestDevice = function(){
        $scope.requestModel = {
            requestReason: "new",
            deviceobj: ''
        }
        ngDialog.open({
            template: 'requestDevice.html',
            className: 'ngdialog-theme-default',
            closeByDocument: false,
            scope: $scope,
            preCloseCallback: function() {
              $scope.requestModel = {
                  requestReason: "new",
                  deviceobj: ''
              }
            }
        });
    }

  $scope.reasonData = [{"key":"replacement","value":"Replacement device"},{"key":"new","value":"New Device with direct payment"}, {"key":"free","value":"Free device with new technician"}];

  $scope.reasonDataText = {"new":"New Device with direct payment", "free":"Free device with new technician","replacement":"Replacement device","new":"New Device with direct payment"};

  $scope.rejectDeviceRequest = function(requestId, status){
    $scope.rejectReason = '';
    $scope.requestId = requestId;
    $scope.status = status;
    ngDialog.open({
        template: 'rejectDevice.html',
        className: 'ngdialog-theme-default',
        closeByDocument: false,
        scope: $scope,
        preCloseCallback: function() {
          $scope.rejectReason = '';
          $scope.requestId = '';
          $scope.status = '';
        }
    });
  }

  $scope.showRejectedNote = function(requestObj){
    if(requestObj && typeof requestObj == 'string'){
      requestObj = JSON.parse(requestObj);
    }
    $scope.requestObj = requestObj;
    ngDialog.open({
        template: 'rejectedNote.html',
        className: 'ngdialog-theme-default',
        closeByDocument: false,
        scope: $scope,
        preCloseCallback: function() {
          $scope.requestObj = '';
        }
    });

  }

  $scope.actionOnDeviceRequest = function(requestId, status, rejectReason){
    if(confirm('Are you sure, you want to change the status to '+status+'?')){
        if(status == 'recieved' || status == 'shipped'){
          $scope.isProcessingDevice = true;
        }else if(status == 'rejected'){
            $scope.isProcessingDeviceReject = true;
        }else{
          $scope.isProcessing = true;
        }
        rejectReason = rejectReason || '';

        apiGateWay.send("/administrator/update_request_device", {requestId: requestId, requestStatus: status, rejectReason: rejectReason}).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 200) {
            $scope.success = message;
            $scope.getDeivceList();
            $scope.closeModal();
            $scope.getRequestedDevices();
          }else{
            $scope.error = message;
            $scope.resetProcess();
          }
        },function(errorResponse){
          $scope.error = errorResponse;
          $scope.resetProcess();
        });
    }
  }

  $scope.printRequest = function(deviceObj) {
      $scope.deviceObj = deviceObj;
      var popupWinindow = window.open('', '_blank', 'left=400,width=800,height=700');
      setTimeout(function(){
        var innerContents = document.getElementById('printhtml').innerHTML;
        popupWinindow.document.open();
        popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + innerContents + '</html>');
        popupWinindow.document.close();
      }, 1000)
  }


  // get inactive or free technician
  $scope.freeTechList = [];

  var getCompanyTechnician = function(){
    apiGateWay.get("/company/get_company_technicians", {limit: 1000}).then(function(response) {
        if(response.data.status == 200){
          var responseData = response.data;
          $scope.freeTechList = [];
          $scope.freeTechList = responseData.data.data;

        }
    }, function(error){

    });
  }
  getCompanyTechnician();

  $scope.changeTech = function(deviceObj, type){
    $scope.deviceObj = deviceObj;
    $scope.deviceObj['type'] = type;

    ngDialog.open({
        template: 'templates/company/devicechangetech.html?ver=' + $rootScope.PB_WEB_VERSION,
        className: 'ngdialog-theme-default',
        scope: $scope,
        closeByDocument: false,
        preCloseCallback: function() {
          $scope.deviceObj = '';
        }
    });
  }




  $scope.switchTech = function(selectedObj, type){
    if(typeof selectedObj == 'string'){
      selectedObj = JSON.parse(selectedObj);
    }
    if(selectedObj){
        var model = {
          "deviceTechId": $scope.deviceObj.deviceTechId,
          "deviceCompMapId": $scope.deviceObj.deviceCompMapId,
          "deviceTechMapId": selectedObj.deviceTechMapId,
          "newTechId": selectedObj.techId,
          "type" : type
        }


        $scope.isProcessing = true;
        apiGateWay.send("/company/switch_device", model).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : '';
            if (responseData.status == 201) {
              $scope.successDevice = message;
              $scope.closeModal();
              $scope.getDeivceList();
              getCompanyTechnician();
            }else{
              $scope.responseData = message;
            }
            $scope.resetProcess();
        },function(errorResponse){
            $scope.errorDevice = errorResponse;
            $scope.resetProcess();
        });
    }
  }


});
