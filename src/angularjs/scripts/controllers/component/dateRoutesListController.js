angular.module('POOLAGENCY')
.controller('dateRoutesListController', function($rootScope, $scope, apiGateWay, $timeout, $filter, $stateParams, $state, auth, ngDialog, configConstant, pendingRequests, $q) { 
    $scope.routeIdx = '';
    $scope.latLongBox = {};
    var getRouteTrigger = function(event, params) { 
        if(params[5] == $scope.routeIdx){
            $scope.getRouteByDate(params[0], params[1], params[2], params[3], params[4],params[5]);
        }
    };
    var refreshListner = $scope.$on('refreshRouteList', getRouteTrigger);
    $scope.$on("$destroy", function () {
        refreshListner();
        delete $rootScope.routes[$scope.routeIdx];        
    });
    $scope.isCheckingProp = {};
    $scope.routeInvalidPropIdx = {};
    $scope.checkInvalidProp = function(route, index){        
        if((index === 0 && $scope.isCheckingProp[route.id]) || $scope.routeInvalidPropIdx[route.id]){
            return;
        }
        if(index === 0){
            $scope.isCheckingProp[route.id] = true;
        }
        var lastPoint = index + 1;
        var origin = '';
        var originArr = [];
        var destination = '';
        var destinationArr = [];
        var wayPoints = []; 
        if(!route.addresses || route.addresses.length == 0 || lastPoint == route.addresses.length || lastPoint > route.addresses.length){
            $scope.isCheckingProp[route.id] = false;
            if(route.addresses && route.addresses[lastPoint]){
                var add = route.addresses[lastPoint];
                var suffix = (!add.oneOfJobId || add.oneOfJobId == 0) ? add.addressId : add.oneOfJobId;
                if (!$("#addBox_"+ route.id +"_"+ suffix).hasClass("invalid-route-property")) {
                        $("#addBox_"+ route.id +"_"+ suffix).addClass('invalid-route-property');                            
                }
                $scope.routeInvalidPropIdx[route.id] = lastPoint;
            }  
            return false;
        }
        if(route.custStartAddrLatLong){
            var latLong = route.custStartAddrLatLong.split(",");
            origin = new google.maps.LatLng(latLong[0], latLong[1]);
            originArr.push({ lat: parseFloat(latLong[0]), lng: parseFloat(latLong[1]) })
        } else {
            if(route.addresses[0].latitude && route.addresses[0].longitude){
                origin = new google.maps.LatLng(route.addresses[0].latitude, route.addresses[0].longitude);                
                originArr.push({ lat: parseFloat(route.addresses[0].latitude), lng: parseFloat(route.addresses[0].longitude) })
            } else {  
                return false;
            }
        }
        destination = new google.maps.LatLng(route.addresses[lastPoint].latitude, route.addresses[lastPoint].longitude);
        destinationArr.push({
            "lat" : parseFloat(route.addresses[lastPoint].latitude), 
            "lng": parseFloat(route.addresses[lastPoint].longitude)
        });
        for (var i = 0; i < lastPoint; i++) { 
            wayPoints.push({
              location: new google.maps.LatLng(route.addresses[i].latitude, route.addresses[i].longitude),
              stopover: true
            });  
        }
        if(originArr.length == 0 || destinationArr.length == 0){
            return;
        }
        setTimeout(function(){            
            var directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin:origin,
                destination: destination,
                waypoints: wayPoints,
                optimizeWaypoints: true,         
                travelMode: 'DRIVING'
            }, function(response, status){
                if(response && status == 'OK' && response.routes  && response.routes.length > 0 && response.routes[0].legs && response.routes[0].legs.length > 0){                    
                    setTimeout(function(){
                        $scope.checkInvalidProp(route, lastPoint);
                    }, 1000);
                }else{
                    if(route.addresses && route.addresses[lastPoint]){
                        var add = route.addresses[lastPoint];
                        var suffix = (!add.oneOfJobId || add.oneOfJobId == 0) ? add.addressId : add.oneOfJobId;
                        if (!$("#addBox_"+ route.id +"_"+ suffix).hasClass("invalid-route-property")) {
                                $("#addBox_"+ route.id +"_"+ suffix).addClass('invalid-route-property');                            
                        }
                        $scope.routeInvalidPropIdx[route.id] = lastPoint;
                    }                                        
                    $scope.isCheckingProp[route.id] = false;
                }
            })
        }, 1000);
    }
    $scope.calculateDuration = function(route){
        $rootScope.routeDuration[route.id] = $rootScope.routeDuration[route.id] ? $rootScope.routeDuration[route.id] : {duration : 0, distance : 0};
        return true;
    }
    $scope.latLongModel = {}
    $scope.showEditLatLong = function(routeId, index){
        if($scope.latLongBox[routeId] && $scope.latLongBox[routeId][index]){
            $scope.latLongBox[routeId][index] = false;
        }else{
            $scope.latLongBox = {};
            $scope.latLongModel.lat = '';
            $scope.latLongModel.long = '';
            $scope.latLongBox[routeId] = [];
            $scope.latLongBox[routeId][index] = true;        
        }
    }
    $scope.isCoordinateProcess = {};
    $scope.updateCoordinate = function(addressId, parentIndex, index){
        var loaderIndex = $scope.routeIdx + "_" + parentIndex + "_" + index;
        $scope.isCoordinateProcess[loaderIndex] = true;
        apiGateWay.send("/set_coordinates", {"addressId": addressId,"isEdited": 0, "lat": 0, "long": 0}).then(function(response) {         
            if (response.data.status == 200){
                var cacheIndex = "route_"+ $rootScope.routes[$scope.routeIdx][parentIndex].id + "_" + $rootScope.routes[$scope.routeIdx][parentIndex].addresses.length;
                delete $rootScope.routeCache[cacheIndex];
                $rootScope.routes[$scope.routeIdx][parentIndex].addresses[index].latitude = response.data.data.latitude;
                $rootScope.routes[$scope.routeIdx][parentIndex].addresses[index].latitude = response.data.data.longitude;
                $scope.getRouteByDate('',true, true, '', '', $scope.routeIdx);
            } 
            $scope.isCoordinateProcess[loaderIndex] = false;
          },function(error) {          
            $scope.isCoordinateProcess[loaderIndex] = false;           
        });
    }
    $scope.editLatLong = function(addressId, parentIndex, index){
        $scope.latLongSuccess = false;
        if(addressId && $scope.latLongModel.lat && $scope.latLongModel.long){
            apiGateWay.send("/set_coordinates", {"addressId": addressId, "isEdited": 1, "lat": $scope.latLongModel.lat, "long":$scope.latLongModel.long}).then(function(response) {         
                if (response.data.status == 200){
                    $rootScope.routes[$scope.routeIdx][parentIndex].addresses[index].latitude = response.data.data.latitude;
                    $rootScope.routes[$scope.routeIdx][parentIndex].addresses[index].latitude = response.data.data.longitude;
                    $scope.getRouteByDate('',true, true, '', '', $scope.routeIdx);
                } 
                setTimeout(function() {
                    $scope.latLongSuccess = false;
                    if (!$scope.$$phase) $scope.$apply()
                }, 1500);
              },function(error) {                    
            });
        }
    }
    $rootScope.technicianLoading = false;
    $rootScope.getRouteByDateRoot = () => {
        $scope.getRouteByDate('popup',false,false,'','')
    }
    $rootScope.isRouteLoading = [];
    $scope.getRouteByDate = function(type='',isLoader=true, refreshMap=false, sourceRouteId='', destRouteId='', routeIdx=''){
        $rootScope.isRouteLoading[routeIdx] = true;
        $rootScope.routesPopupList =[];
        $rootScope.allRoutesPopupList =[];
        var intervalGap = 500;        
        let endpoint = '/route_property_list';
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
        clearInterval($scope.routAPIInteval)
        $scope.routAPIInteval = setTimeout(function(){            
            if(routeIdx || routeIdx === 0){
                $scope.routeIdx = routeIdx
                $scope.activeDate = $rootScope.activeDates[routeIdx];
            }    
            var date = angular.copy($scope.selectedRouteDate);      
            $scope.$parent.isOptimize[$scope.routeIdx] = [];
            const rDate = $scope.activeDate;
            if(rDate && $scope.activeDates.length > 1){
                var selectedDate = moment(rDate).format('YYYY-MM-DD');
            }else{
                var selectedDate  = moment(date).format('YYYY-MM-DD');
            }
            $scope.selectedDate = selectedDate;        
            var lastDate = moment($rootScope.activeDates[($rootScope.activeDates.length - 1)]).format('YYYY-MM-DD');
            var postData = {
                "date": selectedDate,       
                "limit" : $scope.routeLimit,
                "offset":  $scope.routeOffset,
                "searchKey": $rootScope.routeSearchKey
            }
            if(!$scope.isTempMove && $scope.moveType != 'notRouted') {
                postData.date = $filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex])
            }
            postData.date = moment(postData.date).format('YYYY-MM-DD')
            if(isLoader){
                $scope.isProcessing = true;
                if($scope.$parent.$parent){$scope.$parent.$parent.isProcessing = true;}
            }      
            if(refreshMap){
                $rootScope.isProcessingDateChange = true;  
            }
            postData.techFilter = $rootScope.filters["TECHNICIAN"];
            postData.typeFilter = $rootScope.filters["JOB_TYPE"];
            postData.statusFilter = $rootScope.filters["JOB_STATUS"];           
            postData.tags = $rootScope.filters["CUSTOMER_TAG"];           
            if (postData.date === "Invalid date") {
                return
            }
            let propertyIdArr = []; 
            let postDataForRoutes = angular.copy(postData);
            postDataForRoutes.techFilter = [];
            apiGateWay.send(endpoint, postDataForRoutes).then(function(response) {  
                setTimeout(function(){
                    $rootScope.isRouteLoading[routeIdx] = false;
                }, 500)
                $scope.isProcessing = false; 
                auth.setStorage('storedMapDate', date);
                if (response.data.status == 200) {   
                    $rootScope.selectedAddressIdArrayModel = {};
                    $rootScope.selectedAddressDetail = [];
                    $rootScope.selectedAddressDetailModel = {};
                    $scope.selectedAddressIdJobModel = {};
                    $rootScope.selectedAllAddressModel = {};
                    $rootScope.routes[$scope.routeIdx] = [];
                    var routeData = [];
                    if(response.data.data.length > 0){
                        angular.forEach(response.data.data, function(item, index){
                            if (postData.techFilter && postData.techFilter.length > 0) {
                                if (item.techId && postData.techFilter.includes(item.techId)) {
                                    propertyIdArr.push(item.id)  
                                }
                            } else {
                                propertyIdArr.push(item.id)  
                            }
                            var data = angular.copy(item);
                            data.addresses = [];
                            data.isAddressLoaded = false;
                            if (response.data.data.length == index + 1) {
                                function breakPropertyIdArray(arr) {
                                    const maxChunkSize = 30;
                                    const result = [];                                  
                                    for (let i = 0; i < arr.length; i += maxChunkSize) {
                                        result.push(arr.slice(i, i + maxChunkSize));
                                    }                                  
                                    return result;
                                }  
                                const splitedArray = breakPropertyIdArray(propertyIdArr);
                                for (let i = 0; i < splitedArray.length; i++) {  
                                    let postDataForAddresses = angular.copy(postData)
                                    delete postDataForAddresses.limit
                                    delete postDataForAddresses.offset
                                    delete postDataForAddresses.searchKey
                                    postDataForAddresses.propertyId = splitedArray[i];
                                    if((i+1)==splitedArray.length) {
                                        postDataForAddresses.isFinalHit = 1;
                                    }
                                    $scope.getAddresses(postDataForAddresses)
                                }
                            }
                            data.currentDate = $scope.selectedDate;
                            $rootScope.routes[$scope.routeIdx].push(data);
                            routeData.push(data);
                            if(sourceRouteId == data.id) {
                                $scope.googleMapArgs.method.setSingleRoute(data).then(function(){
                                }, function(error){
                                    $scope.toastMessage('routeError', error.error.message);
                                });  
                            }
                            if(destRouteId == data.id) {
                                $scope.googleMapArgs.method.setSingleRoute(data).then(function(){
                                }, function(error){
                                    $scope.toastMessage('routeError', error.error.message);
                                });
                            }
                            $timeout(function(){
                                angular.element(document.getElementsByClassName("route-droppable")).droppable({
                                    accept: "#markerPlaceHolder",
                                    activeClass: "drophere",
                                    hoverClass: "dropaccept",
                                    drop: function(event, ui, item){
                                        canMove = false;
                                        sourceRouteId = $rootScope.gDrag.item.routeId;
                                        destRouteId = $(this).attr('data-li-id');
                                        addressId = $rootScope.gDrag.item.addressId;
                                        days = $rootScope.gDrag.item.days;
                                        sourceRoute = {};
                                        destRoute = {};                                                                       
                                        if(days.length > 0){
                                            if(days.indexOf(moment($scope.selectedRouteDate).format('dddd').toLowerCase()) > -1){
                                                canMove = true;
                                            }                  
                                        } else {
                                            canMove = true;
                                        }
                                        if(!canMove && destRouteId != 0){
                                            ngDialog.open({    
                                                name: 'moveError',
                                                template: 'moveError.html',
                                                className: 'ngdialog-theme-default v-center',
                                                overlay: true,
                                                closeByNavigation: true,
                                                scope: $scope,
                                                preCloseCallback: function () {
                                                }
                                            })
                                        }
                                        if(sourceRouteId != destRouteId && canMove){                                             
                                            if($rootScope.gDrag.item.addressDetail.skipToday == 1 && sourceRouteId != 0 && sourceRouteId != destRouteId){  
                                                $scope.toastMessage('routeError', "A route visit you're trying to move is currently set to be skipped. Please undo the skip setting and try again.", 5000);
                                                $rootScope.gDrag.status = false; 
                                                $rootScope.$apply();
                                            } else {
                                                $scope.moveDragAddress(sourceRoute, sourceRouteId, destRoute, destRouteId, addressId);  
                                                $rootScope.gDrag.status = true;
                                                $rootScope.gDrag.jq.offset({
                                                    top: -30,
                                                    left: 0
                                                  });
                                                $rootScope.$apply();
                                            }
                                        }else{
                                            $rootScope.gDrag.status = false;
                                            $rootScope.$apply();
                                        }
                                    }
                                });
                            }, 1000);
                        })  
                    }
                    if(refreshMap){
                        if(routeData.length > 0){
                        }
                        if(!$scope.isPastDate && lastDate == $scope.selectedDate){
                        } else {                            
                            $rootScope.isCircle = false;
                        }
                        $scope.checkAllRoutIsHide();
                    }
                    $scope.checkBlankRoute($scope.routeIdx);
                    $scope.googleMapArgs.method.setFitBounds();
                } else {
                    $rootScope.isProcessingDateChange = false;  
                }
                    if($scope.$parent.$parent){$scope.$parent.$parent.isProcessing = false;}                
            }, function(error) {  
                setTimeout(function(){
                    $rootScope.isRouteLoading[routeIdx] = false;
                }, 500)
                if(type !== 'popup'){
                    $rootScope.routes[$scope.routeIdx] = [];
                }
                $rootScope.isProcessingDateChange = false; 
                var msg = 'Error';
                if (typeof error == 'object' && error.data && error.data.message) {
                    msg = error.data.message;
                } else {
                    msg = error;
                }
                if (type!=='popup' && error !== 'Something went wrong. Please try again.') {
                    $scope.toastMessage('routeError', msg);
                }
                $scope.isProcessing = false;         
            });
        }, intervalGap)
    }
    $rootScope.routeIndAddressLoading = {};   
    $rootScope.isUserTryingToEditRoute = {};
    $rootScope.getAddress = (route, isSingleRoute=false, isFinalHit=false) => {        
        let postData = {
            "date": "",
            "typeFilter": [],
            "statusFilter": [],
            "propertyId": [],
            "tags": []
        }
        
        postData.techFilter = $rootScope.filters["TECHNICIAN"];
        postData.typeFilter = $rootScope.filters["JOB_TYPE"];
        postData.statusFilter = $rootScope.filters["JOB_STATUS"];           
        postData.tags = $rootScope.filters["CUSTOMER_TAG"];

        postData.date = route.currentDate;
        postData.propertyId = [route.id];        
        postData.isFinalHit = isFinalHit;
        $scope.getAddresses(postData, isSingleRoute, route)
    }
    var delayFactorFirst = 1;
    var directionCount = 1;
    $scope.getAddresses = (payload, isSingleRoute=false, route={}) => {
        let isFinalHit = 0;
        if (payload.isFinalHit) {
            isFinalHit = 1;
            delete payload.isFinalHit
        }
        if (isSingleRoute) {
            if($rootScope.routeIndAddressLoading[route.id]) {
                return
            }
            $rootScope.routeIndAddressLoading[route.id] = true;            
        }
        apiGateWay.send('/route_property_address_list', payload).then(function(AddressResponse) { 
            var requests = [];
            angular.forEach($rootScope.routes, function(routeDay, index2){
                angular.forEach(routeDay, function(route, index3){
                    let addressData = AddressResponse.data.data                    
                    let filteredAddress = addressData.find(obj => obj.id === route.id)
                    if (filteredAddress) {
                        route.movedAddress = []; 
                        route.noAddressForMove = true;
                        route.addresses = [];
                        if(filteredAddress.addresses.length > 0){ 
                            angular.forEach(filteredAddress.addresses, function(address, childIndex){
                                var tempAddress = angular.copy(address)                                 
                                let isRouteStop = !address.oneOfJobId || address.oneOfJobId == 0;
                                let isOneTimeJob = address.oneOfJobId && address.oneOfJobId > 0;
                                let progress = $scope.getJobStatusClasses(isRouteStop ? tempAddress.jobStatusWeb : (isOneTimeJob ? address.jobDetail.jobStatus: null))
                                tempAddress.jobStatusImage = progress.progressIconSrc;                                
                                tempAddress.IsDoneProgressNoAccess = progress.IsDoneProgressNoAccess;                                                                
                                if(!address.isMoved && !address.isAltWeekHide){                                    
                                    route.noAddressForMove = false;
                                }                               
                                tempAddress.movedDetail = address.movedFrom ? address.movedFrom.split('|') : (address.movedTo ? address.movedTo.split('|') : '');  
                                tempAddress.movedFromData = address.movedFromData ? address.movedFromData.split('|') : [];                                                                              
                                tempAddress.movedToData = address.movedToData ? address.movedToData.split('|') : [];               
                                if(!address.jobId && address.jobDetail && address.jobDetail.jobId){
                                    address.jobId = address.jobDetail.jobId;
                                    tempAddress.jobId = address.jobDetail.jobId;
                                }                                
                                route.isAddressLoaded = true
                                if(address.isMoved || address.isAltWeekHide){
                                    route.movedAddress.push(tempAddress)
                                } else {
                                    route.addresses.push(tempAddress)
                                }                                 
                            })
                        } else {
                            route.isAddressLoaded = true;
                        }         
                        route.jobDuration = filteredAddress.jobDuration                       
                        if (isSingleRoute) {
                            $rootScope.routeIndAddressLoading[route.id] = false;                            
                        }   
                        function findIndexesById(arrOfArr, idToFind) {
                            for (let i = 0; i < arrOfArr.length; i++) {
                              const innerArray = arrOfArr[i];
                              for (let j = 0; j < innerArray.length; j++) {
                                if (innerArray[j].id === idToFind) {
                                  return { parentIndex: i, index: j };
                                }
                              }
                            }
                            return { parentIndex: -1, index: -1 };
                        }
                        const xresult = findIndexesById($rootScope.routes, route.id);
                        var parentIndex = xresult.parentIndex;
                        var index = xresult.index; 
                        var deferred = $q.defer();
                        requests.push(deferred.promise);
                        if(route.addresses.length > 0 && !route.isHidden){
                            if(!$scope.getRouteTimer[parentIndex]){
                                $scope.getRouteTimer[parentIndex] = [];
                            }
                            var cacheIndex = "route_"+ route.id + "_" + route.addresses.length;
                            var delay = 0;
                            if(!$rootScope.routeCache[cacheIndex] || ($rootScope.routeCache[cacheIndex] && (!$rootScope.routeCache[cacheIndex].directionsRenderer || $rootScope.routeCache[cacheIndex].directionsRenderer.length == 0))){
                                delay = delayFactorFirst;
                                delayFactorFirst++;
                                if(route.addresses.length > 25){
                                    var extraDelay = Math.floor(route.addresses.length / 25);
                                    if(route.addresses.length % 25){
                                        extraDelay++;
                                    }
                                    delayFactorFirst = delayFactorFirst + extraDelay;
                                }
                            }
                            var delayMS = directionCount < 6 ? 500 : 1000;
                                $scope.getRouteTimer[parentIndex][index] = setTimeout(function(){
                                        $scope.googleMapArgs.method.setSingleRoute(route).then(function(){                                            
                                            $rootScope.zeroRoute[route.id] = false;
                                            deferred.resolve();
                                        }, function(error){
                                            if(error.error.apiStatus == "ZERO_RESULTS"){
                                                $rootScope.zeroRoute[route.id] = true;
                                            }
                                            deferred.reject();     
                                        });
                                }, delay * delayMS);
                            directionCount++;                 
                            routeHasAddress = true;                   
                        } else {
                            deferred.resolve();
                        }  
                    } else {
                    }
                })
                $q.all(requests).then(function(response){ 
                    $rootScope.isProcessingDateChange = false;   
                    $scope.disablePolygonIcon = false;                               
                    $timeout( function(){
                        $scope.resetMapZoom();                                    
                    }, 200)             
                }, function(error) {
                    $rootScope.isProcessingDateChange = false;
                    $scope.disablePolygonIcon = false;
                    $scope.reInitializeMap = false;
                });
            }) 
        }, error => {
            if (isSingleRoute) {
                $rootScope.routeIndAddressLoading[route.id] = false;               
            }
        })
    }
    $rootScope.getRouteByDateForPopup = () => {
        let requestedDateStr = $scope.selectedTempMoveDate;
        if(!$scope.isTempMove && $scope.moveType != 'notRouted') {
            requestedDateStr = $filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex])
        }
        requestedDateStr = moment(requestedDateStr).format('YYYY-MM-DD');
        $rootScope.requestedDateStr = requestedDateStr;
        let loaderParentBox = document.querySelectorAll('.tech-list-for-job-move')[0]
        if (loaderParentBox) loaderParentBox.classList.add('loading')
        var intervalGap = 100;        
        let endpoint = '/route_list';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    r.canceller.resolve()    
                    if (loaderParentBox) loaderParentBox.classList.add('loading')                                    
                    return
                }
            })
        } 
        clearInterval($scope.routPopupAPIInteval)
        $scope.routPopupAPIInteval = setTimeout(function(){ 
            $rootScope.routesPopupList =[];
            $rootScope.allRoutesPopupList =[];
            let pData = {
                fromDate: $scope.selectedDateForMove,
                date: $rootScope.requestedDateStr,
                addressIds: $rootScope.selectAddressIdArray.map(obj => obj.addressId).join(','),
                routeId: $scope.routeId,
                searchKey: $rootScope.routeSearchKey ? $rootScope.routeSearchKey : ''
            }
            pData.techFilter = $rootScope.filters["TECHNICIAN"].length > 0 ? $rootScope.filters["TECHNICIAN"].join(',') : '';
            apiGateWay.get(endpoint, pData).then(function(response) { 
                $rootScope.routesPopupList = response.data.data;
                $rootScope.allRoutesPopupList = response.data.data;
                if (loaderParentBox) loaderParentBox.classList.remove('loading')
            }, function(err) {
                if (loaderParentBox) loaderParentBox.classList.remove('loading')
            })
        }, intervalGap)       
    }
    $scope.movingDayRestrictedPropFromUnscheduledToRouteData = {
        selectedDay: '',
        destDay: ''
    };
    $rootScope.$watch('selectedAddressIdArrayModel', function (newVal, oldVal) {
        $rootScope.selectAddressIdArray = [];
        Object.keys(newVal).forEach(function(key) {
            if(newVal[key]){
                var _input = document.getElementById(key.toString());                
                var addParts = key.toString().split('_');
                var selVal = addParts[0].toString().split('-');
                var jobId = selVal[1]? selVal[1] : '';
                let tempObject = {"addressId":selVal[0].toString().replace("_",""),"jobId":jobId};
                if (_input) {
                    var currDay = _input.getAttribute('data-currday');
                    if (currDay) {
                        tempObject.currDay = currDay;
                    }
                }
                $rootScope.selectAddressIdArray.push(tempObject);
            }
        });
    }, true);
})