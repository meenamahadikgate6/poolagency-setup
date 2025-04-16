angular.module('POOLAGENCY').controller('equipmentFilterController', function($rootScope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    // Equiment filter start     
    $scope.selectionsMade = [];
	$scope.isEmailCenter = false;
	$scope.isComposeMailWindow = false;
	$scope.showFilterBox = false;
    $scope.getStatusName = {};
    $scope.isFilterMasterLoading = {};
    $scope.equipments = [];
    $scope.zipCodesMaster = []; 
    $scope.citiesMaster = []; 
    $scope.tagsMaster = [];
    $scope.isMasterFilterFetched = {};
    $scope.serviceLevelArray = [];
    $scope.routes =[];
    $scope.routesCache =[];
    $scope.isRoutesLoading = false;
    $scope.routeListDate = moment();
    $scope.masterFilterLoading = false;
    $scope.selectionsMade = [];
    $scope.customerSortColumn = 'displayName';
    $scope.customerSortDir = 'asc';
    $scope.filterInitiated = false;
	$scope.equipmentDropdownStatus = {};
	$scope.initFilterArea = function(isComposeMailWindow, pageName) {
		$scope.isComposeMailWindow = isComposeMailWindow;
		$scope.isEmailCenter = (pageName && pageName == 'email-center') ? true : false;
		$scope.initFilter();
	}
	$scope.initFilter = function() {
        if ($scope.filterInitiated) return;
        $scope.filterInitiated = true;
        $scope.closeAllFilterDropdown();
        $scope.getFilterMasterForCustomer('all');
        $scope.getFilterMasterForCustomer('city');
        if (!$scope.isEmailCenter) {
			$scope.getServiceLevelData();
		}
        $scope.fetchRoutes();
    };
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
    $scope.getServiceLevelData = function() {
        apiGateWay.get("/get_service_level").then(function(response) {
            if(response.status == 200) {
              level = $rootScope.sortServiceLevel(response.data.data.serviceLevel, 'serviceLevel');
              $scope.serviceLevelArray = level;
            }
          },function(error){
            $scope.serviceLevelArray = [];
          });
    }
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
    $scope.addToSelections = function(data, type) {
        let selectionId = (type == 'serviceLevel') ? data.serviceLevel.id : data.id;
        let selectionLabel = '';
        selectionLabel = (type == 'serviceLevel') ? data.serviceLevel.title : `<b>`+data.label+`</b>`;
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
	$scope.getFilterMasterForCustomer = function(type) {
        if ($scope.isMasterFilterFetched[type]) {
            return
        }
        let session = auth.getSession();
        let companyId = session.companyId;
        $scope.equipments = []; 
        $scope.isFilterMasterLoading[type] = true;
        $scope.masterFilterLoading = true;
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
            $scope.masterFilterLoading = false;
        }, function(error) {
            $scope.isFilterMasterLoading[type] = false;            
        });
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
		let serviceLevelId = $scope.getSelectionsForPayLoad('serviceLevel');
        let filerPayload = {
            equipmentTypeId: equipmentTypeId,
            zipcode: zipcode,
            city: city,
            invoiceStatus: invoiceStatus,
            tags: tags,
            routes: routes,
            primaryAddress: primaryAddress,
            billingAddress: billingAddress,
            queryMode: $scope.selectedFilterPayloadQueryType.id
        }
		if ($scope.isEmailCenter) {
			filerPayload.customerStatus = customerStatus;
		} else {
			filerPayload.serviceLevelIds = serviceLevelId;
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
	$scope.convertedStatusNames = {
        "Active_noroute" : "ACTIVE (no route)",
        "Active_routed" : "ACTIVE (routed)",
        "Inactive" : "INACTIVE",
        "Lead" : "LEAD"
    }
	$scope.selectionsMadeChanged = function() {
        if ($scope.isEmailCenter) {
			$scope.getFilteredCustomers();
		} else {
			
		}
    } 
})