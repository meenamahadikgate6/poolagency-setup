angular.module('POOLAGENCY')
    .controller('productsnservicesController', function ($scope, $state, $rootScope, $filter, $sce, $http, apiGateWay, service, ngDialog, auth, configConstant, AwsS3Utility, AwsConfigService, BroadcastService) {
        $rootScope.getQboAccounts();
        if (auth.getSession()) {
            if (auth.getSession().id) {
                $scope.loggedInuser = auth.getSession();
            }
        }
        $scope.selectedEvn = configConstant.currEnvironment;
        $scope.env = configConstant[$scope.selectedEvn];
        $scope.cantAllowPermission = 'Your user permission settings don\'t allow this';
        $scope.currentPage = 1;
        $scope.limit = 50;
        $scope.isProcessing = false;
        $scope.sortOrder = 'asc';
        $scope.selectedType = ['Product', 'Service', 'Bundle'];
        $scope.productType = { 'Product': true, 'Service': true, 'Bundle': true };
        $scope.productModel = { 'category': '', 'name': '', 'description': '', 'sku': '', 'heritageNumber': '', 'heritageUOM': '', 'price': '', 'cost': '', 'isChargeTax': '' };
        $scope.heritageUnitMessage = 'Please enter a valid heritage number to get the heritage unit dropdown menu enabled!';
        $scope.productModelCache = {};
        $scope.isProductEditing = false;
        $scope.productStatus = 1;
        $scope.CategoryStatus = 1;
        $scope.currentFilterValue = 'Active';
        $scope.currentFilterValueForCategory = 'Active';
        $scope.productModelDel = {};
        $scope.bundleList = [];
        $scope.bundleListNew = [];
        $scope.isBundleSearch = false;
        $scope.bundleTotal = 0;
        $scope.costBundleTotal = 0;
        $scope.productBundleList = {};
        $scope.bundleSearchForm = false;
        $scope.bundleSearchText = '';
        $scope.column = 'name'
        $scope.addSelectedType = 'Product';
        $scope.searchProductText = '';
        $scope.durationOption = { format: 'HH:mm', showClear: false };
        $scope.selectedDuration = '';
        $scope.heritageNumberCache = null;
        $scope.showHeritageErrorMsg = false;
        $scope.topCounts = {
            products: 0,
            services: 0,
            bundles: 0,
        }
        $scope.isParent = true;
        $scope.categoryText = 'Make this a subcategory';
        // category feature
        $scope.allCategories = [];
        $scope.selectedCategories = [];
        $scope.allSubCategories = [];
        $scope.toggleCategoryCollapsed = true;
        $scope.selectedCategoryForFilter = {};
        $scope.selectedCategory = {};
        $scope.selectedCategoryItemText = '';
        $scope.toggleCategoryCollapsedForOnce = false;
        $scope.allCategoriesIds = [];
        $rootScope.isCommonForm = false;
        $rootScope.isLoadCategory = false;
        $rootScope.isCategoryLoaded = false;
        $scope.makingParentCategory = false;
        $scope.invalidHeritageText = 'Invalid Heritage Number Entered';
        $rootScope.isCommonFormToggle = () => {
            $rootScope.isCommonForm = true;
        }
        $rootScope.loadCategories = () => {
            $rootScope.isLoadCategory = true;
            if (!$rootScope.isCategoryLoaded) {
                $scope.getAllCategories();
                $rootScope.isCategoryLoaded = true;
            }
        }
         
        $scope.toggleCategoryCollapse = function () {
            $scope.toggleCategoryCollapsed = !$scope.toggleCategoryCollapsed;
            if (!$scope.toggleCategoryCollapsed) {
                $scope.setSelectedArray = $scope.selectedFilterCategories;
                if(!$scope.toggleCategoryCollapsedForOnce){
                    $scope.isProcessing = true;
                    $scope.getProductList();
                }
                $scope.toggleCategoryCollapsedForOnce = true;
                $scope.toggleCategoryPanels('show');
            } else {
                $scope.toggleCategoryPanels('hide')
            }
        };
        $scope.toggleCategoryPanels = function (type) {
            $(document).find('.category-panel-header').each(function (i, v) {
                var id = $(this).attr('data-target')
                if (type === 'show') {
                    $(id).collapse('show')
                } else {
                    $(id).collapse('hide')
                }
            });
            $(document).find('.category-panel-subHeader1').each(function (i, v) {
                var id = $(this).attr('data-target')
                if (type === 'show') {
                    $(id).collapse('show')
                } else {
                    $(id).collapse('hide')
                }
            });
            $(document).find('.category-panel-subHeader2').each(function (i, v) {
                var id = $(this).attr('data-target')
                if (type === 'show') {
                    $(id).collapse('show')
                } else {
                    $(id).collapse('hide')
                }
            });
            $(document).find('.category-panel-subHeader3').each(function (i, v) {
                var id = $(this).attr('data-target')
                if (type === 'show') {
                    $(id).collapse('show')
                } else {
                    $(id).collapse('hide')
                }
            });
        }

        $scope.openCategoryPanel = function (id) {
            $(document).find('#cat_panel_' + id).collapse('show');
            $(document).find('#cat_panel_level1_' + id).collapse('show');
            $(document).find('#cat_panel_level2_' + id).collapse('show');
            $(document).find('#cat_panel_level3_' + id).collapse('show');
        }
        $scope.closeCategoryPanel = function (id) {
            $(document).find('#cat_panel_' + id).collapse('hide');
            $(document).find('#cat_panel_level1_' + id).collapse('show');
            $(document).find('#cat_panel_level2_' + id).collapse('show');
            $(document).find('#cat_panel_level3_' + id).collapse('show');
        }
        $scope.getAllCategories = function () {
            $scope.focusedCat = undefined;
            $scope.toggleCategoryCollapsedForOnce = false;
            $scope.isProcessing = true;
            $scope.allCategories = [];
            $scope.selectedCategories = [];
            if ($rootScope.isCommonForm && !$rootScope.isLoadCategory) {
                return
            }
            apiGateWay.get("/category_list", {
                sortOrder: 'asc',
                offset: 0,
                limit: 500,
                sortColumn: 'Name',
                name: '',
                status: $scope.CategoryStatus
            }).then(function (res) {
                $scope.treeData = [];
                $scope.allCategoriesIds = [];
                if (res.data.status == 200 && res.data.data.data.length > 0) {
                    $scope.allCategories = [];
                    $scope.selectedCategories = [];
                    $scope.allSubCategories = [];
                    $scope.selectedFilterCategories = [];
                    $scope.getProductNServicesCount();
                    (res.data.data.data).forEach(function (v) {
                        $scope.selectedCategories.push(v.id ? '' + v.id : '');
                        $scope.treeData.push({
                            id: Number(v.id),
                            name: v.Name,
                            ParentRef: v.ParentRef,
                            fullyQualifiedName: v.FullyQualifiedName,
                            children: [],
                            marginPercentage: v.marginPercentage ? v.marginPercentage : null
                        });
                        if (v.level_1 && v.level_1.length > 0) {
                            (v.level_1).forEach(function (l) {
                                v.catItemCount = v.catItemCount + l.catItemCount;
                                $scope.treeData.forEach(function (td) {
                                    if (l.ParentRef === td.id) {
                                        td.children.push({
                                            id: Number(l.id),
                                            name: l.Name,
                                            ParentRef: l.ParentRef,
                                            topParentRef: l.ParentRef,
                                            fullyQualifiedName: l.FullyQualifiedName,
                                            children: [],
                                            marginPercentage: l.marginPercentage ? l.marginPercentage : null
                                        })
                                    }
                                })
                                $scope.selectedCategories.push(l.id ? '' + l.id : '');
                                if (l.level_2 && l.level_2.length > 0) {
                                    (l.level_2).forEach(function (l2) {
                                        v.catItemCount = v.catItemCount + l2.catItemCount;
                                        l.catItemCount = l.catItemCount + l2.catItemCount;
                                        l2.itemsCount = l2.itemsCount;
                                        $scope.treeData.forEach(function (td) {
                                            td.children.forEach(function (td2) {
                                                if (l2.ParentRef === td2.id) {
                                                    td2.children.push({
                                                        id: Number(l2.id),
                                                        name: l2.Name,
                                                        ParentRef: l2.ParentRef,
                                                        topParentRef: l.ParentRef,
                                                        fullyQualifiedName: l2.FullyQualifiedName,
                                                        children: [],
                                                        marginPercentage: l2.marginPercentage ? l2.marginPercentage : null
                                                    })
                                                }
                                            })
                                        })
                                        $scope.selectedCategories.push(l2.id ? '' + l2.id : '');
                                        if (l2.level_3 && l2.level_3.length > 0) {
                                            (l2.level_3).forEach(function (l3) {
                                                v.catItemCount = v.catItemCount + l3.catItemCount;
                                                l.catItemCount = l.catItemCount + l3.catItemCount;
                                                l2.catItemCount = l2.catItemCount + l3.catItemCount;
                                                $scope.treeData.forEach(function (td) {
                                                    td.children.forEach(function (td2) {
                                                        td2.children.forEach(function (td3) {
                                                            if (l3.ParentRef === td3.id) {
                                                                td3.children.push({
                                                                    id: Number(l3.id),
                                                                    name: l3.Name,
                                                                    ParentRef: l3.ParentRef,
                                                                    topParentRef: l.ParentRef,
                                                                    fullyQualifiedName: l3.FullyQualifiedName,
                                                                    children: [],
                                                                    marginPercentage: l3.marginPercentage ? l3.marginPercentage : null
                                                                })
                                                            }
                                                        });
                                                    })
                                                })
                                                $scope.selectedCategories.push(l3.id ? '' + l3.id : '');
                                            });
                                        }
                                    })
                                }
                            });
                        }
                        $scope.allCategories.push({
                            name: v.Name,
                            createdOn: v.createdOn,
                            id: v.id ? '' + v.id : '',
                            importId: v.importId,
                            modifiedOn: v.modifiedOn,
                            status: v.status,
                            items: [],
                            page: 1,
                            rows: 0,
                            canDelete: true,
                            parentRef: v.ParentRef,
                            category: 'Category',
                            fullyQualifiedName: v.FullyQualifiedName,
                            level1: v.level_1 && v.level_1.length > 0 ? v.level_1 : null,
                            itemsCount: v.catItemCount,
                            marginPercentage: v.marginPercentage ? v.marginPercentage : null
                        });
                    });
                    $scope.selectedCategories = $scope.selectedCategories.filter(function (item, pos) {
                        return $scope.selectedCategories.indexOf(item) == pos;
                    })
                    $scope.selectedFilterCategories = $scope.selectedCategories;
                    if ($scope.CategoryStatus != '0') {
                        $scope.generateUncategorize();
                    }
                    $rootScope.isCategoryLoaded = true;
                    // $scope.getProductList();
                } else {
                    $scope.getProductNServicesCount();
                    if ($scope.CategoryStatus != '0') {
                        $scope.generateUncategorize();
                    }
                    // $scope.getProductList();
                }
                $scope.isProcessing = false;
            }, function (error) {
                $scope.isProcessing = false;
                if ($scope.CategoryStatus != '0') {
                    $scope.generateUncategorize();
                }
                // $scope.getProductList();
            })
        }
        $scope.generateUncategorize = () => {
            $scope.allCategories.push({
                name: 'Uncategorized',
                id: "0",
                // items : [],
                page: 1,
                rows: 0,
            })
            $scope.selectedCategories.push('0');
            $scope.selectedFilterCategories = $scope.selectedCategories;
            $scope.getProductList(0);
        }

        $scope.getProductNServicesCount = function (id, topParentRef) {
            if ($rootScope.isCommonForm) {
                return
            }
            apiGateWay.get("/product_and_service_count", {
                qboCatId: id ? id : null,
                status: $scope.CategoryStatus,
                topParentRef: topParentRef ? topParentRef : id,
                category: $scope.selectedType.join('-')
            }).then(function (res) {
                if (res.data.status == 200) {
                    $scope.topCounts = {
                        products: 0,
                        services: 0,
                        bundles: 0,
                    }
                    if (res.data && res.data.data[res.data.data.length - 1].length > 0) {
                        (res.data.data[res.data.data.length - 1]).forEach(function (number) {
                            if (number.category === 'Product') {
                                $scope.topCounts.products = $scope.topCounts.products + number.count
                            }
                            if (number.category === 'Service') {
                                $scope.topCounts.services = $scope.topCounts.services + number.count
                            }
                            if (number.category === 'Bundle') {
                                $scope.topCounts.bundles = $scope.topCounts.bundles + number.count
                            }
                        })
                    }
                    if (id) {
                        ($scope.allCategories).forEach(function (v) {
                            if (topParentRef == v.id) {
                                v.itemsCount = res.data.data[0].productServiceCount;
                                if(v.catItemCount == 0) {
                                    v.items = [];
                                }
                            }

                            if (v.level1 && v.level1.length > 0) {
                                (v.level1).forEach(function (l) {
                                    if (l.id == id) {
                                        if(res.data.data[0].level_1.length > 0){
                                            l.catItemCount = res.data.data[0].level_1[0].productServiceCount;
                                            if(l.catItemCount == 0) {
                                                l.items = [];
                                            }
                                        }
                                    }
                                    if (l.level_2 && l.level_2.length > 0) {
                                        (l.level_2).forEach(function (l2) {
                                            if (l2.id == id) {
                                                if(res.data.data[0].level_1[0].level_2.length > 0){
                                                    l2.catItemCount = res.data.data[0].level_1[0].level_2[0].productServiceCount;
                                                    if(l2.catItemCount == 0) {
                                                        l2.items = [];
                                                    }
                                                }
                                            }
                                            if (l2.level_3 && l2.level_3.length > 0) {
                                                (l2.level_3).forEach(function (l3) {
                                                    if (l3.id == id) {
                                                            if(res.data.data[0].level_1[0].level_2[0].level_3.length > 0){
                                                                l3.catItemCount = res.data.data[0].level_1[0].level_2[0].level_3[0].productServiceCount;
                                                                if(l3.catItemCount == 0) {
                                                                    l3.items = [];
                                                                }
                                                            }
                                                    }
                                                })
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }

        $scope.filterByCategoryID = function (cat, load = true) {
            $scope.isProcessing = true;
            $scope.selectedCategoryForFilter = cat;
            if (cat.id) {
                if($scope.setSelectedArray.indexOf(cat.id) == -1) $scope.setSelectedArray.push(cat.id);
                if(cat.id != 0){
                    if(cat.level1){
                        cat.level1.forEach(function (items){
                            if($scope.setSelectedArray.indexOf(cat.id) == -1) $scope.setSelectedArray.push(items.id);
                            if(items.level_2){
                                items.level_2.forEach(function (items2){
                                    if($scope.setSelectedArray.indexOf(cat.id) == -1) $scope.setSelectedArray.push(items2.id);
                                    if(items2.level_3){
                                        items2.level_3.forEach(function (items3){
                                            if($scope.setSelectedArray.indexOf(cat.id) == -1) $scope.setSelectedArray.push(items3.id);
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                $scope.selectedCategories = [];
                $scope.selectedCategories.push(cat.id);
            }
            else {
                $scope.selectedCategories = $scope.selectedFilterCategories;
                $scope.setSelectedArray = $scope.selectedCategories;
            }
            $scope.allCategories.forEach(function (category) {
                category.page = 1,
                category.items = []
            });
            if (load) {
                // $scope.resetCatSearch();
                $scope.getProductList();
                $scope.openCategoryPanel(cat.id);
            }
        }
        $scope.resetCatSearch = function () {
            var inputBox = document.getElementById('filterCatListInput');
            inputBox.value = '';
            ul = document.getElementById("filterCatListUl");
            li = ul.getElementsByTagName('li');
            for (i = 0; i < li.length; i++) {
                li[i].style.display = "";
            }
            $scope.selectedCategoryForFilter = {};
            $scope.filterByCategoryID({});
        }
        $scope.filterCatList = function () {
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
        $scope.focusedCat;
        $scope.loadMoreProducts = function (cat) {
            $(document).find('#load_more_btn_' + cat.id).addClass('loading-more-cats')
            $scope.loadingMore = true;
            $scope.focusedCat = cat;
            $scope.toggleCategoryCollapsedForOnce = false;
            $scope.getProductList(cat.id);
        }
        //function to get customer list
        $scope.allCategoriesId = () => {
            var ids = [];
            if($scope.selectedCategories){
                ($scope.selectedCategories).forEach(function (v) {
                    ids.push(v);
                })
                return ids.join(',')
            }
        }
        $scope.getCatDetailsById = function (id) {
            if(id == 0){
                let rows = ($scope.allCategories).find(x => x.id === id);
                rows.itemsCount = rows.rows.toLocaleString();
                return rows;
            }
            else {
                return ($scope.allCategories).find(x => x.id === id);
            }
        }
        $scope.getlevel1 = function (cat) {
            var level1 = [];
            if (cat && cat.level1 && cat.level1.length > 0) {
                level1 = cat.level1
            }
            return level1;
        }
        $scope.getLevel1CatDetailsById = function (l1) {
            if (l1) {
                let res = {
                    name: l1.Name,
                    createdOn: l1.createdOn,
                    id: l1.id ? '' + l1.id : '',
                    importId: l1.importId,
                    modifiedOn: l1.modifiedOn,
                    status: l1.status,
                    items: l1.items ? l1.items : [],
                    page: l1.page,
                    rows: l1.rows,
                    canDelete: l1.canDelete,
                    parentRef: l1.ParentRef,
                    category: 'Category',
                    fullyQualifiedName: l1.FullyQualifiedName.replaceAll(':', ' > '),
                    level2: l1.level_2 && l1.level_2.length > 0 ? l1.level_2 : null,
                    itemsCount : l1.catItemCount,
                    marginPercentage: l1.marginPercentage
                };
                return res;
            }
        }
        $scope.getlevel2 = function (cat) {
            var level2 = [];
            if (cat && cat.level2 && cat.level2.length > 0) {
                level2 = cat.level2;
            }
            return level2;
        }
        $scope.getLevel2CatDetailsById = function (l2) {
            if (l2) {
                let res = {
                    name: l2.Name,
                    createdOn: l2.createdOn,
                    id: l2.id ? '' + l2.id : '',
                    importId: l2.importId,
                    modifiedOn: l2.modifiedOn,
                    status: l2.status,
                    items: l2.items ? l2.items : [],
                    page: l2.page,
                    rows: l2.rows ,
                    canDelete: l2.canDelete,
                    parentRef: l2.ParentRef,
                    category: 'Category',
                    fullyQualifiedName: l2.FullyQualifiedName.replaceAll(':', ' > '),
                    level3: l2.level_3 && l2.level_3.length > 0 ? l2.level_3 : null,
                    itemsCount: l2.catItemCount,
                    marginPercentage: l2.marginPercentage
                };
                return res;
            }
        }

        $scope.getlevel3 = function (cat) {
            var level3 = [];
            if (cat.level3 && cat.level3.length > 0) {
                level3 = cat.level3
            }
            return level3;
        }

        $scope.getLevel3CatDetailsById = function (l3) {
            if (l3) {
                let res = {
                    name: l3.Name,
                    createdOn: l3.createdOn,
                    id: l3.id ? '' + l3.id : '',
                    importId: l3.importId,
                    modifiedOn: l3.modifiedOn,
                    status: l3.status,
                    items: l3.items ? l3.items : [],
                    page: 1,
                    rows: l3.rows,
                    canDelete: true,
                    parentRef: l3.ParentRef,
                    category: 'Category',
                    fullyQualifiedName: l3.FullyQualifiedName.replaceAll(':', ' > '),
                    itemsCount: l3.catItemCount,
                    marginPercentage: l3.marginPercentage
                };
                return res;
            }
        }

        $scope.product_services_list = {};
        $scope.setSelectedArray = [];
        $scope.getProductList = function (id) {
            $scope.page = 1;
            if (!$scope.toggleCategoryCollapsedForOnce) {
                if (id && $scope.allCategoriesIds.indexOf(id) == -1 || $scope.allCategoriesIds.length == 0) {
                    $scope.searchItems = false;
                    $scope.catId = id;
                    $scope.allCategoriesIds.push(id);
                    $scope.getProductListFinal(id);
                }
                if ($scope.setSelectedArray.length > 0) {
                    $scope.searchItems = true;
                    $scope.allCategoriesIds = $scope.allCategoriesIds.concat($scope.setSelectedArray); 
                    $scope.catId = $scope.setSelectedArray.join(',');
                    if($scope.allCategoriesIds.indexOf(id) == -1){
                        $scope.getProductListFinal();
                    }
                }
                if ($scope.focusedCat) {
                    $scope.page = $scope.focusedCat.page;
                    if ($scope.loadingMore) {
                        $scope.page = $scope.focusedCat.page == 1 ? $scope.focusedCat.page + 1 : $scope.focusedCat.page;
                        if ($scope.allCategoriesIds.indexOf(id) == -1) {
                            $scope.allCategoriesIds.push(id);
                        }
                        $scope.loadingMore = false;
                    }
                    $scope.catId = $scope.focusedCat.id;
                    $scope.getProductListFinal();
                }
            } else {
                if ($scope.setSelectedArray.length > 0) {
                    $scope.setSelectedArray = $scope.setSelectedArray.filter((item, index) => $scope.setSelectedArray.indexOf(item) === index);
                    $scope.catId = $scope.setSelectedArray.join(',');
                    $scope.getProductListFinal();
                }
            }
        };

        $scope.getProductListFinal = function (id) {
            if ($rootScope.isCommonForm) {
                return
            }
            apiGateWay.get("/product_services_list", {
                offset: $scope.page - 1,
                limit: $scope.limit,
                sortOrder: $scope.sortOrder,
                sortColumn: $scope.column,
                category: $scope.selectedType.join('-'),
                status: $scope.productStatus,
                name: $scope.searchProductText,
                qboCatId: $scope.catId,
            }).then(function (response) {
                if (response.data.status == 200) {
                    $scope.companyProductTax = response.data.data.companyProductTax;
                    $scope.companyServiceTax = response.data.data.companyServiceTax;
                    // loadmore
                    if ($scope.focusedCat) {
                        var res = response.data.data.data[$scope.selectedCategoryForFilter.id ? $scope.selectedCategoryForFilter.id : $scope.catId];
                        // Handle newly loaded items for load more
                        $scope.handleLoadMoreData(res);
                    } else {
                        ($scope.allCategories).forEach(function (v) {
                            let categoryWiseProducts = null;
                            if (v.id == id) {
                                categoryWiseProducts = response.data.data.data[v.id];
                            }
                            else {
                                categoryWiseProducts = response.data.data.data[v.id];
                            }
                            if ($scope.setSelectedArray.length > 0) {
                                $scope.setSelectedArray.forEach(function (id) {
                                    if (v.id == id) {
                                        if(response.data.data.data[v.id]){
                                            categoryWiseProducts = response.data.data.data[v.id];
                                        } else { 
                                            // $scope.isRecordsFoundCheck();
                                            v.items = [];
                                            v.itemsCount = 0;
                                        }
                                    }
                                })
                            }
                            if (categoryWiseProducts) {
                                v.items = categoryWiseProducts.data;
                                v.rows = categoryWiseProducts.rows;
                                v.page = 1;
                                if($scope.searchItems){
                                    v.itemsCount = response.data.data.data[v.id].rows;
                                }
                                if (v.items && v.items.length > 0) {
                                    (v.items).forEach(function (item) {
                                        item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                    })
                                }
                            } else {
                                if($scope.selectedType.length < 3){
                                    v.items = [];
                                    v.itemsCount = 0;
                                }
                            }
                            if (v.level1 && v.level1.length > 0) {
                                (v.level1).forEach(function (l) {
                                    // level1
                                    var categoryWiseProducts = response.data.data.data[l.id];
                                    
                                    if ($scope.setSelectedArray.length > 0) {
                                        $scope.setSelectedArray.forEach(function (id) {
                                            if (l.id == id) {
                                                if(response.data.data.data[l.id]){
                                                    categoryWiseProducts = response.data.data.data[l.id];
                                                }
                                                else{
                                                    l.items = [];
                                                    l.catItemCount = 0;
                                                }
                                            }
                                        })
                                    }
                                    if (categoryWiseProducts) {
                                        l.items = [];
                                        l.items = categoryWiseProducts.data;
                                        l.rows = categoryWiseProducts.rows;
                                        l.page = 1;
                                        if($scope.searchItems){
                                            l.catItemCount = response.data.data.data[l.id].rows;
                                            if (l.items && l.items.length > 0) {
                                                v.itemsCount = v.itemsCount + l.catItemCount;
                                                if(v.items.length == 0){
                                                    v.itemsCount = l.catItemCount;
                                                }
                                            }
                                        }
                                    }
                                    else{
                                        if($scope.selectedType.length < 3){
                                            l.items = [];
                                            l.catItemCount = 0;
                                        }
                                    }
                                    if (l.items && l.items.length > 0) {
                                        (l.items).forEach(function (item) {
                                            item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                        })
                                    }
                                    if (l.level_2 && l.level_2.length > 0) {
                                        (l.level_2).forEach(function (l2) {
                                            // level 2
                                            var categoryWiseProducts = response.data.data.data[l2.id];
                                            
                                            if ($scope.setSelectedArray.length > 0) {
                                                $scope.setSelectedArray.forEach(function (id) {
                                                    if (l2.id == id) {
                                                        if(response.data.data.data[l2.id]){
                                                            categoryWiseProducts = response.data.data.data[l2.id];
                                                        }
                                                        else {
                                                            // $scope.isRecordsFoundCheck();
                                                            l2.items = [];
                                                            l2.catItemCount = 0;
                                                        }
                                                    }
                                                })
                                            }
                                            if (categoryWiseProducts) {
                                                l2.items = [];
                                                l2.items = categoryWiseProducts.data;
                                                l2.rows = categoryWiseProducts.rows;
                                                l2.page = 1;
                                                if($scope.searchItems){
                                                    l2.catItemCount = categoryWiseProducts.rows;
                                                    if (l2.items && l2.items.length > 0) {
                                                        l.catItemCount = l.catItemCount + categoryWiseProducts.rows;
                                                        if(v.items.length == 0){
                                                            v.itemsCount = l.catItemCount;
                                                        }
                                                        (l2.items).forEach(function (item) {
                                                            item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                                        })
                                                    }
                                                }
                                            }
                                            else{
                                                if($scope.selectedType.length < 3){
                                                    l2.items = [];
                                                    l2.catItemCount = 0;
                                                }
                                            }
                                            if (l2.level_3 && l2.level_3.length > 0) {
                                                l2.level_3.forEach(function (l3) {
                                                    // level 3
                                                    var categoryWiseProducts = response.data.data.data[l3.id];
                                                    
                                                    if ($scope.setSelectedArray.length > 0) {
                                                        $scope.setSelectedArray.forEach(function (id) {
                                                            if (l3.id == id) {
                                                                if(response.data.data.data[l3.id]){
                                                                    categoryWiseProducts = response.data.data.data[l3.id];
                                                                }
                                                                else {
                                                                    // $scope.isRecordsFoundCheck();
                                                                    l3.items = [];
                                                                    l3.catItemCount = 0;
                                                                }   
                                                            }
                                                        })
                                                    }
                                                    if (categoryWiseProducts) {
                                                        l3.items = [];
                                                        l3.items = categoryWiseProducts.data;
                                                        l3.rows = categoryWiseProducts.rows;
                                                        l3.page = 1;
                                                        if($scope.searchItems){
                                                            l3.catItemCount = categoryWiseProducts.rows;
                                                            l2.catItemCount = l2.catItemCount + categoryWiseProducts.rows;
                                                            l.catItemCount = l.catItemCount + categoryWiseProducts.rows;
                                                            v.itemsCount = v.rows + l.catItemCount;
                                                            if (l3.items && l3.items.length > 0) {
                                                                if(l.items.length == 0){
                                                                    l.catItemCount = l2.catItemCount;
                                                                }
                                                                if(v.items.length == 0){
                                                                    v.itemsCount = l.catItemCount;
                                                                }
                                                                (l3.items).forEach(function (item) {
                                                                    item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                                                })
                                                            }
                                                        }
                                                        if (l3.items && l3.items.length > 0) {
                                                            (l3.items).forEach(function (item) {
                                                                item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                                            })
                                                        }
                                                    }
                                                    else{
                                                        if($scope.selectedType.length < 3){
                                                            l3.items = [];
                                                            l3.catItemCount = 0;
                                                        }
                                                    }

                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    $scope.setSelectedArray = [];
                    if ($scope.searchProductText != '' || $scope.currentFilterValue == 'Archived' || $scope.selectedCategoryForFilter.id) {
                        setTimeout(function () {
                            $scope.toggleCategoryPanels('show');
                        }, 200);
                    } else {
                        // $scope.toggleCategoryPanels('show');
                    }
                    if (!$scope.toggleCategoryCollapsed) {
                        $scope.toggleCategoryPanels('show');
                    }
                    $scope.isProductSearching = false;
                }
                $scope.isRecordsFoundCheck();
                $scope.isProcessing = false;
            });
            // $scope.getAllCategories();
        }

        $scope.handleLoadMoreData = function (res) {
            let _selectedCategoryForLoadMore = ($scope.allCategories).find(x => x.id === $scope.catId);
            // check if category is found in all parent categories (Level-1) and load more data
            if (_selectedCategoryForLoadMore) {
                _selectedCategoryForLoadMore.page = $scope.page + 1;
                _selectedCategoryForLoadMore.rows = res.rows;
                res.data.forEach(function (z) {
                    _selectedCategoryForLoadMore.items.push(z);
                });
                if (_selectedCategoryForLoadMore.items && _selectedCategoryForLoadMore.items.length > 0) {
                    (_selectedCategoryForLoadMore.items).forEach(function (item) {
                        item.qboCatId = item.qboCatId ? '' + item.qboCatId : ''
                    });
                }
            }
            // If not found in parent categories (Level-1) then check in child categories (Level-2, Level-3)
            else {
                ($scope.allCategories).forEach(function (v) {
                    if (v.level1 && v.level1.length > 0) {
                        // check in level-1
                        (v.level1).forEach(function (l) {
                            if (l.id == $scope.catId) {
                                var categoryWiseProducts = res.data;
                                if (categoryWiseProducts && categoryWiseProducts.length > 0) {
                                    (categoryWiseProducts).forEach(function (item) {
                                        item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                    })
                                    // check if items already exists in level-1
                                    if (l.items && l.items.length > 0) {
                                        // append new items to existing items
                                        (categoryWiseProducts).forEach(function (item) {
                                            l.items.push(item);
                                        });
                                    } else {
                                        // set new items to level-1
                                        l.items = categoryWiseProducts;
                                    }
                                    // set rows count
                                    l.rows = res.rows;
                                    l.page = $scope.page;
                                }
                            }
                            if (l.level_2 && l.level_2.length > 0) {
                                // check in level-2
                                (l.level_2).forEach(function (l2) {
                                    if (l2.id == $scope.catId) {
                                        var categoryWiseProducts = res.data;
                                        if (categoryWiseProducts && categoryWiseProducts.length > 0) {
                                            (categoryWiseProducts).forEach(function (item) {
                                                item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                            })
                                            // check if items already exists in level-2
                                            if (l2.items && l2.items.length > 0) {
                                                // append new items to existing items
                                                (categoryWiseProducts).forEach(function (item) {
                                                    l2.items.push(item);
                                                });
                                            } else {
                                                // set new items to level-2
                                                l2.items = categoryWiseProducts;
                                            }
                                            // set rows count
                                            l2.rows = res.rows;
                                            l2.page = $scope.page;
                                        }
                                    }
                                    if (l2.level_3 && l2.level_3.length > 0) {
                                        // check in level-3
                                        (l2.level_3).forEach(function (l3) {
                                            if (l3.id == $scope.catId) {
                                                var categoryWiseProducts = res.data;
                                                if (categoryWiseProducts && categoryWiseProducts.length > 0) {
                                                    (categoryWiseProducts).forEach(function (item) {
                                                        item.qboCatId = item.qboCatId ? '' + item.qboCatId : '';
                                                    })
                                                    // check if items already exists in level-3
                                                    if (l3.items && l3.items.length > 0) {
                                                        // append new items to existing items
                                                        (categoryWiseProducts).forEach(function (item) {
                                                            l3.items.push(item);
                                                        });
                                                    } else {
                                                        // set new items to level-3
                                                        l3.items = categoryWiseProducts;
                                                    }
                                                    // set rows count
                                                    l3.rows = res.rows;
                                                    l3.page = $scope.page;
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            $(document).find('#load_more_btn_' + $scope.catId).removeClass('loading-more-cats');
            $scope.focusedCat = null;
        }
        $scope.isRecordsFound = false;
        $scope.isRecordsFoundCheck = function () {
            $scope.isRecordsFound = false;
            // $scope.selectedCategories.length = 0;
            $scope.allCategories.forEach(function (category) {
                if (category.items && category.items.length > 0) {
                    $scope.isRecordsFound = true;
                    if (category.level1) {
                        category.level1.forEach(function (level1) {
                            if (level1.items && level1.items.length > 0) {
                                $scope.isRecordsFound = true;
                                if (level1.level_2) {
                                    level1.level_2.forEach(function (level2) {
                                        if (level2.items && level2.items.length > 0) {
                                            $scope.isRecordsFound = true;
                                            if (level2.level_3) {
                                                level2.level_3.forEach(function (level3) {
                                                    if (level3.items && level3.items.length > 0) {
                                                        $scope.isRecordsFound = true;
                                                    }
                                                });
                                            }
                                        }
                                        else if (level2.level_3) {
                                            level2.level_3.forEach(function (level3) {
                                                if (level3.items && level3.items.length > 0) {
                                                    level2.items = [];
                                                    level2.items.length = 1;
                                                    $scope.isRecordsFound = true;
                                                }
                                            });
                                        }
                                    })
                                }
                            }
                            else if (level1.level_2) {
                                level1.level_2.forEach(function (level2) {
                                    if (level2.items && level2.items.length > 0) {
                                        category.items.length = 1;
                                        level1.items = [];
                                        level1.items.length = 1;
                                        $scope.isRecordsFound = true;
                                    }
                                    else if (level2.level_3) {
                                        level2.level_3.forEach(function (level3) {
                                            if (level3.items && level3.items.length > 0) {
                                                level1.items.length = 1;
                                                level2.items = [];
                                                level2.items.length = 1;
                                                $scope.isRecordsFound = true;
                                            }
                                        });
                                    }
                                })
                            }
                        })
                    }
                }
                else if (category.level1) {
                    category.level1.forEach(function (level1) {
                        if (level1.items && level1.items.length > 0) {
                            category.items.length = 1;
                            $scope.isRecordsFound = true;
                        }
                        else if (level1.level_2) {
                            level1.level_2.forEach(function (level2) {
                                if (level2.items && level2.items.length > 0) {
                                    category.items.length = 1;
                                    level1.items = [];
                                    level1.items.length = 1;
                                    $scope.isRecordsFound = true;
                                }
                                else if (level2.level_3) {
                                    level2.level_3.forEach(function (level3) {
                                        if (level3.items && level3.items.length > 0) {
                                            category.items.length = 1;
                                            level1.items.length = 1;
                                            level2.items = [];
                                            level2.items.length = 1;
                                            $scope.isRecordsFound = true;
                                        }
                                    });
                                }
                            })
                        }
                    })
                }
            })
        }
        $scope.searchProductList = (searchText) => {
            $scope.searchProductText = searchText;
            $scope.isProductSearching = true;
            clearInterval($scope.productSearchInterval);
            $scope.toggleCategoryCollapsedForOnce = false;
            $scope.productSearchInterval = setTimeout(function () {
                $scope.toggleCategoryPanels('hide');
                $scope.allCategories.forEach(function (category) {
                        category.page = 1,
                        category.items = []
                    });
                    $scope.setSelectedArray = $scope.selectedFilterCategories;
                    // $scope.isProcessing = true;
                    $scope.getProductList();
            }, 1000)
        };

        $scope.addBundleProductSearch = () => {
            $scope.bundleSearchForm = true;
        }
        $scope.$on('productAddEvent', function(event, data) {
            if (data && data.widgetArea == 'productServicePage') {    
                if (data.isClose) {
                    $scope.bundleSearchForm = false                
                    return
                }    
                $scope.addProductToBundle(data);
            }
        });
        $scope.addProductToBundle = (product) => {
            let bundleObj =
            {
                "id": product.id,
                "category": product.category,
                "name": product.name,
                "price": product.price,
                "cost": product.cost,
                "sku": product.sku,
                "heritageNumber": product.heritageNumber,
                "heritageUOM": product.heritageUOM,
                "description": product.description,
                "qty": product.qty ? product.qty : 1,
                "isChargeTax": product.isChargeTax ? product.isChargeTax : 0,
                "duration": product.duration ? product.duration : '00:00:00',
                "photos": product.photos ? product.photos : []
            }

            $scope.bundleList.push(bundleObj);
            $scope.bundleListNew = angular.copy($scope.bundleList);
            $scope.bundleSearchText = '';
            $scope.isBundleSearch = false;
            $scope.bundleSearchForm = false;
            $scope.calculateBundleCost();
            if ($scope.isProductEditing) {
                $scope.saveBundleForm();
            }

        };

        $scope.editBundleItem = (index) => {
            $scope.calculateBundleCost();
            if (!$scope.bundleList[index].qty) {
                $scope.bundleList[index].qty = 0;
            }
            if ($scope.isProductEditing && $scope.bundleListNew[index].qty != $scope.bundleList[index].qty) {
                $scope.saveBundleForm();
            }
        }
        $scope.isProductServicesBundleSaving = false;
        $scope.saveBundleForm = () => {
            if ($scope.bundleList.length >= 0) {
                $scope.isProcessing = true;
                $scope.isProductServicesBundleSaving = true;
                let bundleData = {
                    "category": "Bundle",
                    "name": $scope.productModel.name,
                    "heritageNumber": $scope.productModel.heritageNumber,
                    "heritageUOM": $scope.productModel.heritageUOM,
                    "description": $scope.productModel.description,
                    "price": $scope.bundleTotal,
                    "cost": $scope.costBundleTotal,
                    "showIndividualPrice": $scope.productModel.showIndividualPrice,
                    "status": $scope.productModel.status,
                    "bundleItemReference": $scope.bundleList
                }
                if ($scope.productModel.id) {
                    bundleData.id = $scope.productModel.id;
                }
                if ($scope.productModel.qboCatId) {
                    bundleData.qboCatId = $scope.productModel.qboCatId;
                }
                $scope.bundleListNew = angular.copy($scope.bundleList);
                apiGateWay.send("/product_services_save", bundleData).then(function (response) {
                    if (response.data.status == 200) {
                        $scope.productModel.price = $scope.bundleTotal;
                        $scope.productModel.cost = $scope.costBundleTotal;
                        $scope.successProductForm = response.data.message;
                        $scope.getProductList();
                        if (!$scope.isProductEditing) {
                            ngDialog.close();
                        }
                        setTimeout(function () {
                            $scope.successProductForm = '';
                        }, 2000)
                    } else {
                        $scope.errorProductForm = 'Error';
                        setTimeout(function () {
                            $scope.errorProductForm = "";
                        }, 2000);
                    }
                    $scope.isProcessing = false;
                    $scope.isProductServicesBundleSaving = false;
                }, function (error) {
                    $scope.isProcessing = false;
                    $scope.isProductServicesBundleSaving = false;
                    $scope.errorProductForm = error;
                    setTimeout(function () {
                        $scope.errorProductForm = "";
                    }, 2000);
                });
            } else {
                $scope.errorProductForm = "Please add at least one product or service to bundle";
                setTimeout(function () {
                    $scope.errorProductForm = "";
                }, 2000);
            }

        }
        // $scope.orderByProductList = function(column) {
        //     $scope.column = column;
        //     $scope.sortOrder = ($scope.sortOrder == 'desc') ? 'asc' : 'desc';
        //     $scope.allCategories.forEach(function(category){
        //         category.page = 1,
        //         category.items = []
        //     })
        //     $scope.getProductList();
        //     // $scope.getAllCategories();
        // };

        //function to redirect to customer detail page
        $scope.goToDetail = function (addrId, isPrimary = "") {
            if (addrId) {
                ngDialog.close();
                if (isPrimary == 1) {
                    $state.go("app.customerdetail", {
                        addressId: addrId
                    });
                } else {
                    $state.go("app.locationdetail", {
                        addressId: addrId
                    });
                }

            }
        };

        $scope.getNumberToArray = function (num) {
            return new Array(num);
        };
        $scope.goToProductPage = function (page) {
            $scope.currentPage = page;
            $scope.getProductList();
        };

        $scope.filterByCategory = function (node) {
            $scope.currentPage = 1;
            let type = node; //.toLowerCase()
            let allFilterRemoved = Object.entries($scope.productType).filter(function (item) {
                return item[1] == true
            })
            if (allFilterRemoved.length > 1 || !$scope.productType[type]) {
                $scope.productType[type] = !$scope.productType[type];
                const index = $scope.selectedType.indexOf(type);
                if (index > -1) {
                    $scope.selectedType.splice(index, 1)
                } else {
                    $scope.selectedType.push(type);
                }
                $scope.currentPage = 1;
                $scope.allCategories.forEach(function (category) {
                    category.page = 1,
                    category.items = []
                });
                $scope.setSelectedArray = $scope.selectedFilterCategories;
                // $scope.getAllCategories();
                $scope.isProcessing = true;
                $scope.getProductList();
            }

        };
        $scope.filterByStatus = function (node) {
            $scope.isProcessing = true;
            $scope.currentPage = 1;
            $scope.currentFilterValue = node;
            if (node == 'Active') {
                $scope.productStatus = '1';
            } else if (node == 'Archived') {
                $scope.productStatus = '0';
            } else {
                $scope.productStatus = '';
            }
            $scope.allCategories.forEach(function (category) {
                category.page = 1,
                    category.items = []
            });
            $scope.setSelectedArray = $scope.selectedFilterCategories;
            $scope.toggleCategoryCollapsedForOnce = false;
            $scope.getProductList();
            // $scope.getAllCategories();
        };
        $scope.filterCategroryByStatus = function (node) {
            $scope.selectedCategories = [];
            $scope.filterByCategoryID({}, false);
            $scope.currentFilterValueForCategory = node;
            if (node == 'Active') {
                $scope.CategoryStatus = '1';
            } else if (node == 'Archived') {
                $scope.CategoryStatus = '0';
            } else {
                $scope.CategoryStatus = '';
            }
            // $scope.allCategories.forEach(function(category){
            //     category.page = 1,
            //     category.items = []
            // })
            $scope.getAllCategories();
        }

        $scope.successBrowse = false;
        $scope.errorBrowse = false;
        // $scope.selected = {};
        $scope.selectedCategoryy = function (cat, load = true) {
            if ($scope.allCategories.length < 2) {
                $scope.treeData = [];
            }
            if (!$scope.treeData || $scope.treeData.length == 0) {
                $scope.treeData = [{
                    name: 'No Category Found',
                    // fullyQualifiedName: 'No Category Found',
                }]
            }
            if (cat && cat.id > 0) {
                $scope.selectedCategoryItem = cat;
                if ($scope.productModel.name) {
                    $scope.fullyQualifiedName = $scope.selectedCategoryItem.fullyQualifiedName + '>' + $scope.productModel.name;
                }
                $scope.selectedCategoryItemText = $scope.selectedCategoryItem.fullyQualifiedName.replaceAll
                    (':', ' > ');
                $scope.productModel.qboCatId = cat.id;
                // $scope.addEditProduct('qboCatId')
            }
        }

        $scope.selectedCategoryEdit = function (cat, load = true) {
            $scope.setSelectedArray = [];
            if (cat && $scope.selected.id != cat.id) {
                $scope.selectedCategoryItem = cat;
                $scope.selectedCategoryItemText = $scope.selectedCategoryItem.fullyQualifiedName.replaceAll(':', ' > ');
                $scope.productModel.qboCatId = cat.id;
                if($scope.setSelectedArray.indexOf(cat.id) == -1)  {
                    $scope.setSelectedArray.push($scope.selected.id,cat.id);
                }
                if ($scope.isProductEditing) {
                    $scope.archiveProductPop = false;
                    $scope.addEditProduct('qboCatId');
                }
            }
        }
        $scope.setSelectedCache = 0;
        $scope.setSelected = (cat) => {
            $scope.selectedCategoryItem = cat;
            $scope.setSelectedArray = [];   
            // if ($scope.selected && $scope.selected.id != cat.id) {
                if($scope.setSelectedArray.indexOf(cat.id) == -1) {
                    $scope.setSelectedArray.push($scope.selected.id,cat.id);
                }
                $scope.topParentRef = cat.topParentRef;
                $scope.productModel.qboCatId = cat.id;
                if ($scope.setSelectedCache != cat.id) {
                    $scope.setSelectedCache = cat.id;
                    const exists = $scope.getItemById($scope.productModel.qboCatId);
                    if (exists && exists.marginPercentage) {
                        $scope.productModel.usePriceMargin = true;
                        $scope.productModel.marginPercentage = exists.marginPercentage;
                        if ($scope.popupDirty) {
                            $scope.calculateCPM('marginPercentage');
                        }
                    } else {
                        if ($scope.isProductEditing) {
                            $scope.addEditProduct('qboCatId');
                        }
                    }
                }
            // }
            return cat.id;
        }
        $scope.selectedTreeView = function (product) {
            ($scope.treeData).map(function (v) {
                if (v.id === Number(product.qboCatId)) {
                    if (v) {
                        $scope.selected = v;
                    }
                }
                else if (v.id !== Number(product.qboCatId)) {
                    v.children.forEach(function (c) {
                        if (c.id === Number(product.qboCatId)) {
                            if (c) {
                                $scope.selected = c;
                            }
                        }
                        else if (c.id !== Number(product.qboCatId)) {
                            c.children.forEach(function (c2) {
                                if (c2.id === Number(product.qboCatId)) {
                                    if (c2) {
                                        $scope.selected = c2;
                                    }
                                }
                                else if (c2.id !== Number(product.qboCatId)) {
                                    c2.children.forEach(function (c3) {
                                        if (c3.id === Number(product.qboCatId)) {
                                            if (c3) {
                                                $scope.selected = c3;
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }

        $scope.setZeroTimeDuration = function () {
            if(!$scope.isProductEditing){
                $scope.productModel.selectedDuration = "2014-02-27T00:00:00";
            }
        }
        $scope.popupDirty = false;
        $rootScope.openProductForm = function (product, type, preDefinedName='') {
            $scope.popupDirty = false;
            $scope.bundleList = [];
            $scope.bundleListNew = [];
            $scope.heritageUnits = [];
            $scope.bundleSearchForm = false;
            $scope.isBundleSearch = false;
            $scope.bundleTotal = 0;
            $scope.costBundleTotal = 0;
            $scope.showHeritageErrorMsg = false;
            $scope.invalidHeritageText = '';
            $scope.heritageNumberCache = null;
            if (product) {

                if (product.category == 'Product') {
                    $scope.getChemicalName = '.';
                    apiGateWay.get("/get_chemicalproduct_mapping", {
                        ProductandServiceid: product.id
                    }).then(function (response) {
                        if (response.data.status == 200) {
                            $scope.getChemicalName = response.data.data;
                            if($scope.getChemicalName) {
                                if(product.canDelete) { productCanDelete = 'deleted'}
                                else { productCanDelete = 'archive' }
                                $scope.cantAllowPermission = "This product can't be "+ productCanDelete  +" since it is currently associated with a chemical in settings. An admin user would first need to change the product associated, which must be done from settings.";
                                $scope.chemicalNameTip= 'This product is associated with this chemical in settings. If the chemical is automatically added to an invoice, this is the product that will be used for that line item. You can change which products are associated with which chemicals in settings.';
                            }
                        } else {
                            $scope.getChemicalName = null;
                        }
                    });
                }
                $scope.isProductEditing = true;
                if (product.parentRef < 1) {
                    $scope.selectedCategoryItem = product;
                    $scope.categoryText = 'Make this is a subcategory';
                    $scope.isParent = true;
                    $scope.selectedCategoryItemText = '';
                    if(product.category !== 'Category') {
                        if($scope.treeData.length > 0) {
                            if ($scope.treeData[0].id !== 0) {
                                $scope.treeData.unshift({
                                    id: 0,
                                    name: 'None',
                                    ParentRef: 0,
                                    fullyQualifiedName: 'None',
                                    children: [],
                                });
                            }
                        }
                        else{
                            $scope.treeData.unshift({
                                id: 0,
                                name: 'None',
                                ParentRef: 0,
                                fullyQualifiedName: 'None',
                                children: [],
                            });
                        }
                    }
                    else {
                        if($scope.treeData.length> 0){
                            if ($scope.treeData[0].id == 0) {
                                $scope.treeData.shift();
                            }
                        }
                    } 
                    $scope.selected = $scope.treeData[0];
                } else {
                    $scope.selectedCategoryItem = product;
                    $scope.categoryText = 'Make this is a Parent Category';
                    if ($scope.treeData) {
                        if(product.category !== 'Category') {
                            if($scope.treeData.length > 0) {
                                if ($scope.treeData[0].id !== 0) {
                                    $scope.treeData.unshift({
                                        id: 0,
                                        name: 'None',
                                        ParentRef: 0,
                                        fullyQualifiedName: 'None',
                                        children: [],
                                    });
                                }
                            }
                            else{
                                $scope.treeData.unshift({
                                    id: 0,
                                    name: 'None',
                                    ParentRef: 0,
                                    fullyQualifiedName: 'None',
                                    children: [],
                                });
                            }
                        }
                        else {
                            if($scope.treeData.length> 0){
                                if ($scope.treeData[0].id == 0) {
                                    $scope.treeData.shift();
                                }
                            }
                        }   
                        $scope.treeData.forEach(function (c) {
                            if (c.children && c.children.length > 0) {
                                c.children.forEach(function (child) {
                                    if (child.name == product.name) {
                                        $scope.selected = child;
                                    }
                                    else {
                                        if (child.children && child.children.length > 0) {
                                            child.children.forEach(function (child2) {
                                                if (child2.name == product.name) {
                                                    $scope.selected = child2;
                                                }
                                                else {
                                                    if (child2.children && child2.children.length > 0) {
                                                        child2.children.forEach(function (child3) {
                                                            if (child3.name == product.name) {
                                                                $scope.selected = child3;
                                                            }
                                                        })
                                                    }
                                                }
                                            });
                                        }
                                    }
                                })
                            }
                        });
                        $scope.selectedTreeView(product);
                    }
                    if (product.fullyQualifiedName) {
                        var a = product.fullyQualifiedName;
                        var nameSplit = a.split(">");
                        nameSplit.pop();
                        $scope.selectedCategoryItemText = nameSplit.join(">");
                        $scope.isParent = false;
                    }
                }
                $scope.productModel = angular.copy(product);
                if ($scope.productModel.category == 'Product' && $scope.productModel.heritageNumber) {
                    $scope.getHeritageUnits($scope.productModel);
                    $scope.heritageNumberCache = $scope.productModel.heritageNumber;
                } else {
                    $scope.heritageNumberCache = null;
                }
                if (type === 'Category') {
                    $scope.addSelectedType = 'Category';
                } else {
                    $scope.addSelectedType = product.category;
                }
                $scope.bundleList = product.bundleItemReference;
                $scope.bundleListNew = angular.copy($scope.bundleList);
                if (product.category == 'Service') {
                    $scope.getChemicalName = null;
                    if ($scope.productModel.duration && $scope.productModel.duration != 'None') {
                        $scope.productModel.selectedDuration = "2014-02-27T" + $scope.productModel.duration;
                    } else {
                        $scope.productModel.selectedDuration = "2014-02-27T00:00:00";
                    }
                }
            // 
            if ($scope.addSelectedType != 'Bundle') {
                $scope.productModel.usePriceMargin = false;
                if ($scope.productModel.marginPercentage && $scope.productModel.marginPercentage > 0) {
                    $scope.productModel.usePriceMargin = true;
                }
            }
            // 
            } else {
                $scope.isProductEditing = false;
                $scope.tempId = '';
                $scope.addSelectedType = 'Product';
                if (type) {
                    $scope.addSelectedType = type;
                }
                $scope.productModel = {};
                if (preDefinedName != '') {
                    $scope.productModel.name = preDefinedName;                    
                }
                $scope.selectedCategoryItemText = '';
                $scope.fullyQualifiedName = '';
                if ($scope.addSelectedType == 'Service') {
                    $scope.productModel.selectedDuration = "2014-02-27T00:00:00";
                }
                if ($scope.addSelectedType == 'Category') {
                    $scope.selectedCategoryItem = {};
                    $scope.selected = {};
                    $scope.categoryText = 'Make this a subcategory';
                    $scope.isParent = true;
                    if ($scope.treeData) {
                        $scope.treeData.forEach(item => {
                            if (item.id == 0) {
                                $scope.treeData.shift();
                            }
                        })
                    }
                }
                else {
                    if($scope.treeData.length > 0) {
                        $scope.treeData.forEach(item => {
                            if(item.name == 'No Category Found'){
                                $scope.treeData.shift();
                            }
                        })
                        if($scope.treeData.length > 0){
                            if ($scope.treeData[0].id !== 0) {
                                $scope.treeData.unshift({
                                    id: 0,
                                    name: 'None',
                                    ParentRef: 0,
                                    fullyQualifiedName: 'None',
                                    children: [],
                                });
                            }
                        }
                        else{
                        $scope.treeData.unshift({
                            id: 0,
                            name: 'None',
                            ParentRef: 0,
                            fullyQualifiedName: 'None',
                            children: [],
                        });
                    }
                    $scope.selected = $scope.treeData[0];
                    }
                    else{
                        $scope.treeData.unshift({
                            id: 0,
                            name: 'None',
                            ParentRef: 0,
                            fullyQualifiedName: 'None',
                            children: [],
                        });
                    }
                    $scope.selected = $scope.treeData[0];
                }

                $scope.productModel.isChargeTax = 0;
                if ($scope.companyProductTax && $scope.addSelectedType == 'Product') {
                    $scope.productModel.isChargeTax = 1;
                } else if ($scope.companyServiceTax && $scope.addSelectedType == 'Service') {
                    $scope.productModel.isChargeTax = 1;
                }

                // init income expense account
                if ($scope.addSelectedType == 'Product') {
                    $scope.productModel.incomeAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.product_income ? $rootScope.defaultQboAccounts.product_income : null;
                    $scope.productModel.expenseAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.product_expense ? $rootScope.defaultQboAccounts.product_expense : null;        
                }
                if ($scope.addSelectedType == 'Service') {
                    $scope.productModel.incomeAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.service_income ? $rootScope.defaultQboAccounts.service_income : null;
                    $scope.productModel.expenseAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.service_expense ? $rootScope.defaultQboAccounts.service_expense : null;       
                }
                // init income expense account

                if ($scope.addSelectedType != 'Bundle') {
                    $scope.productModel.usePriceMargin = false;
                    $scope.productModel.priceLock = false;
                }
            }
            if ($scope.addSelectedType == 'Bundle') {
                $scope.getChemicalName = false;
                $scope.calculateBundleCost();
            }
            setTimeout(function(){
                $scope.popupDirty = true;
            }, 1200)
            $scope.productModelCache = angular.copy($scope.productModel);
            $scope.isMarginChanged = false;
            $scope.addProductPopup = ngDialog.open({
                template: 'addProductTemplate.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByEscape: $scope.isProductEditing,
                closeByDocument: $scope.isProductEditing,
                preCloseCallback: function () {
                    if ($scope.isMarginChanged && $scope.isProductEditing &&  $scope.productModel.category == 'Category') {
                        return false;
                    }
                    $scope.isProductEditing = false;
                    $scope.productModel.name = $scope.productModelCache.name;
                    $scope.marginHasError = false;
                    $scope.popupDirty = false;
                    $scope.showHeritageErrorMsg = false;
                }
            });
        };
        $scope.deleteBundleItem = (index) => {
            $scope.bundleList.splice(index, 1);
            $scope.bundleListNew = angular.copy($scope.bundleList);
            $scope.calculateBundleCost();
            if ($scope.isProductEditing) {
                $scope.saveBundleForm();
            }

        };
        $scope.calculateBundleCost = () => {
            $scope.bundleTotal = 0;
            $scope.costBundleTotal = 0;
            $scope.bundleList = $scope.bundleList || [];
            if ($scope.bundleList.length > 0) {
                angular.forEach($scope.bundleList, function (value, key) {
                    $scope.bundleTotal = $scope.bundleTotal + value.price * value.qty;
                    $scope.costBundleTotal = Number($scope.costBundleTotal) + Number(value.cost) * value.qty;
                })
            }

        };
        $scope.selectProductType = (productType) => {
            if (productType == 'Category') {
                $scope.selected = {};
                $scope.isParent = true;
                $scope.categoryText = 'Make this is a subcategory';
                $scope.treeData.forEach(item => {
                    if (item.id == 0) {
                        $scope.treeData.shift();
                    }
                })
            }
            else {
                if($scope.treeData.length > 0) {
                    $scope.treeData.forEach(item => {
                        if(item.name == 'No Category Found'){
                            $scope.treeData.shift();
                        }
                    })
                    if($scope.treeData.length > 0){
                        if ($scope.treeData[0].id !== 0) {
                            $scope.treeData.unshift({
                                id: 0,
                                name: 'None',
                                ParentRef: 0,
                                fullyQualifiedName: 'None',
                                children: [],
                            });
                        }
                    }
                    else{
                    $scope.treeData.unshift({
                        id: 0,
                        name: 'None',
                        ParentRef: 0,
                        fullyQualifiedName: 'None',
                        children: [],
                    });
                }
                $scope.selected = $scope.treeData[0];
                }
                else{
                    $scope.treeData.unshift({
                        id: 0,
                        name: 'None',
                        ParentRef: 0,
                        fullyQualifiedName: 'None',
                        children: [],
                    });
                }
                $scope.selected = $scope.treeData[0];
            }
            if (productType == 'Service') {
                $scope.productModel.selectedDuration = "2014-02-27T00:00:00";
            } else {
                $scope.productModel.selectedDuration = '';
            }

            if ($scope.companyProductTax && productType == 'Product') {
                $scope.productModel.isChargeTax = 1;
            } else if ($scope.companyServiceTax && productType == 'Service') {
                $scope.productModel.isChargeTax = 1;
            } else {
                $scope.productModel.isChargeTax = 0;
            }
            // update income expense account
            if (!$scope.isProductEditing && productType == 'Product') {
                $scope.productModel.incomeAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.product_income ? $rootScope.defaultQboAccounts.product_income : 0;
                $scope.productModel.expenseAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.product_expense ? $rootScope.defaultQboAccounts.product_expense : 0;        
            }
            if (!$scope.isProductEditing && productType == 'Service') {
                $scope.productModel.incomeAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.service_income ? $rootScope.defaultQboAccounts.service_income : 0;
                $scope.productModel.expenseAccountRef = $rootScope.defaultQboAccounts && $rootScope.defaultQboAccounts.service_expense ? $rootScope.defaultQboAccounts.service_expense : 0;       
            }
            // update income expense account
            $scope.addSelectedType = productType;
        };

        $scope.archiveProduct = function () {
            $scope.isProcessing = true;
            $scope.productModel.status = '0';
            var params = $scope.productModel;
            var apiUrl = "/product_services_save";
            if ($scope.addSelectedType === 'Category') {
                apiUrl = "/category_save";
                var catParams = {
                    name: params.name,
                    id: params.id ? Number(params.id) : undefined,
                    status: '0'
                }
                params = catParams;
            }
            apiGateWay.send(apiUrl, params).then(function (response) {
                if (response.data.status == 200) {
                    if ($scope.addSelectedType === 'Category') {
                        $scope.successProductList = 'Category disabled successfully.';
                    } else {
                        $scope.successProductList = response.data.message;
                        $scope.getProductList();
                    }
                    $scope.getAllCategories();
                    ngDialog.close();
                    setTimeout(function () {
                        $scope.successProductList = '';
                    }, 2000)
                } else {
                    $scope.errorProductForm = 'Error Archiving';
                    setTimeout(function () {
                        $scope.errorProductForm = '';
                    }, 2000)
                }
            }, function (error) {
                $scope.isProcessing = false;
                $scope.errorProductForm = error;
                setTimeout(function () {
                    $scope.errorProductForm = "";
                    $scope.errorProductList = "";
                }, 2000);
            });
        };
        $scope.unArchiveProduct = function () {
            $scope.isProcessing = true;
            $scope.productModel.status = '1';
            var params = $scope.productModel;
            var apiUrl = "/product_services_save";
            if ($scope.addSelectedType === 'Category') {
                apiUrl = "/category_save";
                var catParams = {
                    name: params.name,
                    id: params.id ? Number(params.id) : undefined,
                    status: '1'
                }
                params = catParams;
            }
            apiGateWay.send(apiUrl, params).then(function (response) {
                if (response.data.status == 200) {
                    if ($scope.addSelectedType === 'Category') {
                        $scope.successProductList = 'Category enabled successfully.';
                    } else {
                        $scope.successProductList = response.data.message;
                    }
                    if($scope.currentFilterValue) {
                        $scope.setSelectedArray = $scope.selectedFilterCategories;
                        $scope.getProductList();
                        // $scope.getAllCategories();
                    }
                    ngDialog.close();
                    setTimeout(function () {
                        $scope.successProductList = '';
                    }, 2000)
                } else {
                    $scope.errorProductForm = 'Error Unarchiving';
                    setTimeout(function () {
                        $scope.errorProductForm = '';
                    }, 2000)
                }
            }, function (error) {
                $scope.isProcessing = false;
                $scope.errorProductForm = error;
                setTimeout(function () {
                    $scope.errorProductForm = "";
                    $scope.errorProductList = "";
                }, 2000);
            });
        };

        $scope.archiveProductPopup = function () {
            $scope.archiveProductPop = ngDialog.open({
                template: 'archiveProductPopup.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByEscape: true,
                closeByDocument: true,
                preCloseCallback: function () {

                }
            });
        };

        $scope.deleteProduct = function (id) {
            $scope.productModelDel.category = $scope.addSelectedType;
            $scope.productModelDel.id = id;
            var params = $scope.productModelDel;
            var apiUrl = "/product_services_delete";
            if ($scope.addSelectedType === 'Category') {
                apiUrl = "/category_save";
                params.category = undefined;
                params.status = "0";
                params.name = $scope.productModel.name ? $scope.productModel.name : $scope.productModelCache.name;
                params.id = Number(id);
            }
            apiGateWay.send(apiUrl, params).then(function (response) {
                if (response.data.status == 200) {
                    if ($scope.addSelectedType == 'Product' || $scope.addSelectedType == 'Service') {
                        $scope.deletePSFiles()
                    }
                    $scope.successProductList = response.data.message;
                    ngDialog.close();
                    setTimeout(function () {
                        $scope.successProductList = '';
                        $scope.treeData = [];
                        $scope.getAllCategories();
                        // $scope.getProductList();
                    }, 1000)
                } else {
                    $scope.errorProductList = response.data.message;
                    $scope.deleteProductPop.close();
                    setTimeout(function () {
                        $scope.errorProductList = '';
                    }, 2000)
                }
            }, function (error) {
                $scope.isProcessing = false;
                $scope.deleteProductPop.close();
                $scope.errorProductForm = error;
                setTimeout(function () {
                    $scope.errorProductForm = "";
                    $scope.errorProductList = "";
                }, 2000);
            });
        };

        $scope.deleteProductPopup = function (product) {
            $scope.deleteProductPop = ngDialog.open({
                template: 'deleteProductPopup.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByEscape: true,
                closeByDocument: true,
                preCloseCallback: function () {

                }
            });
        };

        $scope.adjustNgDialogHeight = function () {
            setTimeout(function () {
                if (document.getElementsByClassName("modal-box")[0].offsetHeight + 188 > window.innerHeight) {
                    document.getElementsByClassName("ngdialog-overlay")[0].style.right = '17px';
                } else {
                    document.getElementsByClassName("ngdialog-overlay")[0].style.right = '0';
                }
            }, 100)
        }
        $scope.isProductServicesSaving = false;
        $scope.addEditProduct = function (node) {
            if ($scope.productModel.name === undefined || $scope.productModel.name === null || $scope.productModel.name.trim() === '') {
                // $scope.productModel.name = $scope.productModelCache.name
                return;
            }
            if ((node == 'marginPercentage' && $scope.productModel[node] === null) || $scope.productModelCache[node] != $scope.productModel[node] || !node || ($scope.addSelectedType == 'Service' && $scope.productModel.duration != moment($scope.productModel.selectedDuration).format('HH:mm:ss').toString())) {

                if ($scope.addSelectedType == 'Service') {
                    $scope.productModel.duration = moment($scope.productModel.selectedDuration).format('HH:mm:ss').toString();
                }

                //masking reverse - start

                if ($scope.productModel.cost != undefined) {
                    $scope.productModel.cost = $scope.productModel.cost.toString();
                    if ($scope.productModel.cost) {
                        $scope.productModel.cost = $scope.productModel.cost.replace(/\$|,/g, '');
                    }
                }

                if ($scope.productModel.price != undefined) {
                    $scope.productModel.price = $scope.productModel.price.toString();
                    if ($scope.productModel.price) {
                        $scope.productModel.price = $scope.productModel.price.replace(/\$|,/g, '');
                    }
                }
                // End
                // if heritage number is not a valid number and clicked save - save it as null
                if ($scope.addSelectedType == 'Product' && $scope.showHeritageErrorMsg 
                    &&  $scope.invalidHeritageText == 'Heritage number cannot be validated, please try again later!') {
                    $scope.productModel.heritageNumber = null;
                }
                $scope.productModel.cost = !$scope.productModel.cost ? 0 : $scope.productModel.cost;
                $scope.productModel.price = !$scope.productModel.price ? 0 : $scope.productModel.price;

                // $scope.productModel.qboCatId = $scope.productModel.qboCatId ? Number($scope.productModel.qboCatId) : null
                // price margin feature
                if (($scope.addSelectedType == 'Product' || $scope.addSelectedType == 'Service' || $scope.addSelectedType == 'Category') && ($scope.productModel.marginPercentage != null && $scope.productModel.marginPercentage != undefined) && node !== 'priceLock') {
                    if ($scope.productModel.marginPercentage != null && $scope.productModel.marginPercentage != undefined) {
                        $scope.productModel.marginPercentage = $scope.productModel.marginPercentage.toString();
                        $scope.productModel.marginPercentage = $scope.productModel.marginPercentage.replace(/\$|,/g, '');
                        $scope.productModel.marginPercentage = Number($scope.productModel.marginPercentage)
                        if ($scope.isMarginChanged && ($scope.productModel.marginPercentage < 1 || $scope.productModel.marginPercentage > 9000)) {
                            $scope.marginHasError = true;
                            $scope.errorProductForm = 'Markup must be between 1 and 9000';
                            setTimeout(function(){
                                $scope.errorProductForm = '';
                            }, 2000)
                            return;
                        }
                    }
                }  
                if(node === 'priceLock') { $scope.isPriceLockToggleInProgress = true; }
                if(node === 'price') { $scope.isPriceUpdateInProgress = true; }
                if(node === 'cost') { $scope.isCostUpdateInProgress = true; }
                if(node === 'marginPercentage') { $scope.isMarginUpdateInProgress = true; }
                if ($scope.productModel.marginPercentage == '') { $scope.productModel.marginPercentage = null; $scope.productModel.usePriceMargin = false }
                // price margin feature
                // $scope.isProcessing = true;
                $scope.productModel.category = $scope.addSelectedType;
                var params = $scope.productModel;
                var apiUrl = "/product_services_save";
                if ($scope.addSelectedType === 'Category') {
                    apiUrl = "/category_save";
                    var catParams = {
                        name: params.name,
                        id: params.id ? Number(params.id) : undefined,
                        status: params.status,
                        marginPercentage: $scope.productModel.marginPercentage,
                    }
                    if ($scope.selectedCategoryItem && $scope.selectedCategoryItem.id) {
                        if ($scope.selectedCategoryItem.id !== params.id) {
                            catParams.ParentRef = Number($scope.selectedCategoryItem.id);
                        } else if ($scope.selectedCategoryItem.parentRef && $scope.selectedCategoryItem.parentRef > 0) {
                            catParams.ParentRef = Number($scope.selectedCategoryItem.parentRef);
                        }
                    }
                    if ($scope.makingParentCategory) {
                        catParams.makingParentCategory = true;
                        $scope.makingParentCategory = false;
                    }
                    params = catParams;
                }
                if (params.name === undefined || params.name === null || params.name.trim() === '') {
                    return
                }
                $scope.isProductServicesSaving = true;      
                if ($scope.updateImagePathById && $scope.updateImagePathByIdPhotos.length > 0) {
                    params.id = $scope.updateImagePathById;
                    params.photos = $scope.updateImagePathByIdPhotos;
                }          
                // price margin feature
                params.isPriceUpdating = node === 'price';
                params.isMarginUpdatingForCategory = (node === 'marginPercentage' && $scope.addSelectedType === 'Category');
                // price margin feature
                $scope.productModelCache = angular.copy($scope.productModel);
                // assign category name to qboCatName start
                if (params.qboCatId) {
                    params.qboCatName = $scope.getItemById(params.qboCatId).fullyQualifiedName ? $scope.getItemById(params.qboCatId).fullyQualifiedName : $scope.getItemById(params.qboCatId).FullyQualifiedName;
                } else {
                    params.qboCatName = ''
                }
                // qbo cat name assign end
                apiGateWay.send(apiUrl, params).then(function (response) {
                    // $scope.selectedCategoryItem = {};
                    if (response.data.status == 200) {
                        if ($scope.addSelectedType !== 'Category' && !params.isPriceUpdating) {
                            const data = response.data.data;
                            if (data && 'price' in data && 'cost' in data && 'marginPercentage' in data) {
                                $scope.productModel.price = data.price;
                                // $scope.productModel.cost = data.cost;  
                                // if (data.marginPercentage < 0) {
                                //     data.marginPercentage = 0 
                                // }
                                // if (data.marginPercentage == 0) data.marginPercentage = null;
                                // $scope.productModel.marginPercentage = data.marginPercentage;
                            }
                        }
                        if(!$scope.productModel.id){
                            if($scope.productModel.photos){                                
                                $scope.copyPSImage(response.data.data.transactionId, params);                                
                            }
                        }
                        if($scope.focusedCat){
                            $scope.focusedCat.page = 1;
                            $scope.focusedCat = undefined;
                        }
                        else{
                            // $scope.getAllCategories();
                        }
                        // $scope.selectedCategoryItem = {};
                        // $scope.isParent = false;
                        $scope.selectedCategoryItemText = '';
                        // $scope.selected = {};
                        if ($scope.addSelectedType === 'Category') {
                            $scope.getAllCategories();
                            if($scope.archiveProductPop){
                                $scope.archiveProductPop.close();
                                ngDialog.close();
                            }
                        } else {
                            if ($scope.setSelectedArray.length == 0) {
                                $scope.allCategoriesIds = [];
                                $scope.getProductList($scope.selected.id);
                            }
                            else{ $scope.getProductList()}
                        }                        
                        if ($rootScope.isCommonForm) {                                                      
                            $scope.addProductPopup.close();                            
                            $rootScope.refreshProductSearch($scope.productModel.name);
                            return
                        }
                        if (!$scope.isProductEditing) {
                            $scope.successProductList = response.data.message;
                            ngDialog.close();
                        } else {
                            // ngDialog.close();
                            $scope.successProductForm = response.data.message;
                        }
                        if (params.category == 'Product' && params.heritageNumber && params.heritageNumber != '') {
                            $scope.getHeritageUnits(params);
                        }
                        setTimeout(function () {
                            $scope.successProductForm = '';
                            $scope.successProductList = '';
                        }, 2000)
                    } else {
                        $scope.errorProductForm = 'Error in saving';
                        setTimeout(function () {
                            $scope.errorProductForm = "";
                            $scope.errorProductList = "";
                        }, 2000);
                    }
                    $scope.isProcessing = false;
                    $scope.isProductServicesSaving = false;
                    if(node === 'priceLock') { $scope.isPriceLockToggleInProgress = false; }
                    if(node === 'price') { $scope.isPriceUpdateInProgress = false; }
                    if(node === 'cost') { $scope.isCostUpdateInProgress = false; }
                    if(node === 'marginPercentage') { $scope.isMarginUpdateInProgress = false; }
                }, function (error) {
                    if(node === 'priceLock') { $scope.isPriceLockToggleInProgress = false; }
                    if(node === 'price') { $scope.isPriceUpdateInProgress = false; }
                    if(node === 'cost') { $scope.isCostUpdateInProgress = false; }
                    if(node === 'marginPercentage') { $scope.isMarginUpdateInProgress = false; }
                    $scope.isProcessing = false;
                    $scope.isProductServicesSaving = false;
                    $scope.errorProductForm = error;
                    if (error == 'Another product, service, bundle or Category is already using this name. Please use a different name.') {
                        $scope.getProductListFinal();
                    }
                    setTimeout(function () {
                        $scope.errorProductForm = "";
                        $scope.errorProductList = "";
                    }, 2000);
                });
            };
        }

        $scope.getCustomerJobList = function (i) {
            if (i == true) {
                $scope.isParent = false;
                $scope.categoryText = "Make this a Parent Category";
                $scope.selected = { fullyQualifiedName: ''}
            }
            else {
                if ($scope.isProductEditing) {
                    $scope.selectedCategoryItem = {};
                    $scope.productModel.status = 0;
                    if ($scope.productModel.name) {
                        $scope.parentPoppup();
                    }
                }
                else {
                    $scope.selectedCategoryItem = {};
                    $scope.isParent = true;
                    $scope.categoryText = 'Make this a subcategory';
                }
            }
        }

        $scope.parentPoppup = function () {
            $scope.archiveProductPop = ngDialog.open({
                template: 'parentPoppup.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByEscape: true,
                closeByDocument: true,
                preCloseCallback: function () {

                }
            });
        };

        $scope.accountNameCache = {
            asset: [],
            expense: [],
            income: [],
        }

        $scope.copyPSImage = function(newProId, params) {
            var oldPrefix  = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/' + $scope.tempId + '/';
            var newPrefix =  $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/' + newProId + '/';
            AwsS3Utility.list([oldPrefix])
            .then(function(data) {                
                if (data[0].Contents.length) {
                    var items = [];
                    var items_for_delete = [];
                    angular.forEach(data[0].Contents, function(file, cb) {
                        let copySource = file.Key;
                        let key = file.Key.replace(oldPrefix, newPrefix);
                        items.push({
                            sourceKey: copySource,
                            destinationKey: key
                        });
                        items_for_delete.push(copySource)                                        
                    });
                    if (items.length > 0) {
                        AwsS3Utility.copyFiles(items)
                        .then(function(data) {                                                        
                            AwsS3Utility.deleteFiles(items_for_delete)                                
                            $scope.tempId = '';
                        })
                    }                   
                }
            })
            .catch(function(error) {
                // error in loading
            })
        }

        $scope.getRandomFileName = function(name='') {
            let fileName = '';
            name = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
            let nameArr = name.split('.');
            let extension = nameArr.pop();
            let _name = nameArr.join('_');
            fileName = _name + '_' + new Date().getTime();
            return fileName;
        }

        $scope.getProductModelId = function() {
            var possible = '0123456789012345678901234567890123456789';
            var result = '';
            for (var i = 15; i > 0; --i) {
                result += possible[Math.floor(Math.random() * possible.length)];
            }
            return 'xtemp_' + result + new Date().getTime() + '_tempx';
        }

        // quote image uploading    
        $scope.awsCDNpath = '';    
        AwsConfigService.fetchAwsConfig().then(function(config) {
            $scope.awsCDNpath = config.domain;
        });
        $scope.PSImageAwsUploadPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/';  
        $scope.PSImageProcessing = false;
        $scope.tempId = '';
        $scope.PSLiImageInputChange = function (e) {
            if(!$scope.productModel.photos){
                $scope.productModel.photos = [];
            }
            if(!$scope.isProductEditing && !$scope.tempId){
                $scope.tempId = $scope.getProductModelId();
            }
            let awsUploadPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/' + ($scope.tempId ? $scope.tempId : $scope.productModel.id);
            var files = e.target.files;
            var _file = files[0];
            var _extension = _file.name.split(".");
            _extension = _extension[_extension.length - 1];
            _extension = _extension.toLowerCase();
            _allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'pdf'];
            if (_allowedExtensions.includes(_extension)) {
                $scope.PSImageProcessing = true;
                var _lineitem = $scope.productModel;
                var newFileName = $scope.getRandomFileName(_file.name);
                newFileName = newFileName + '.' + _extension;                
                let key = awsUploadPath + '/' + newFileName;
                let body = _file;
                AwsS3Utility.upload(key, body)
                    .then(function (data) {
                        // uploaded 
                        _lineitem.photos.push({
                            caption: _extension == 'pdf' ?  _file.name : "",
                            fileName: key,
                            filePath: ""
                        });
                        if($scope.isProductEditing){
                            $scope.addEditProduct();
                        }
                        $scope.PSImageProcessing = false;
                        e.target.value = null;
                        setTimeout(function () {
                            // document.getElementById('PSImageProcessing_loader').classList.remove('show')
                        }, 1000)
                    })
                    .catch(function (error) {
                        // error in uploading
                        $scope.PSImageProcessing = false;
                        e.target.value = null;
                        // document.getElementById('PSImageProcessing_loader').classList.remove('show')
                        return false;
                    })
            } else {
                e.target.value = null;
                $scope.showImageError();
                return;
            }
        }

        $scope.deletePSImagePopup = function(_lineitem, _photo, _id) {
            $scope.imageSelectedForDeletion = {
                _lineitem: _lineitem,
                _photo: _photo,
                _id: _id
            }
            $scope.deletePSImageConfirmPopup = ngDialog.open({
                template: 'deletePSConfirm.html',
                className: 'ngdialog-theme-default',
                scope: $scope,
                preCloseCallback: function() {
                    $scope.imageSelectedForDeletion = null;
                }
            });
        };
        $scope.imageDeleting = {}
        $scope.deletePSImage = function() {
            var _lineitem= $scope.imageSelectedForDeletion._lineitem;
            var _photo= $scope.imageSelectedForDeletion._photo;            
            var _id= $scope.imageSelectedForDeletion._id;            
            $scope.imageDeleting[_id] = true; 
            $scope.deletePSImageConfirmPopup.close();            
            let key = _photo.fileName;
            var photos = [];
            photos.push(key)
            if (photos.length > 0) {
                AwsS3Utility.deleteFiles(photos)
                .then(function(data) {
                    data.Deleted.forEach(function(responseItem) {                    
                        const deletedFileName = responseItem.Key;                                      
                        const indexToDelete = _lineitem.photos.findIndex(item => item.fileName.includes(deletedFileName));                                      
                        if (indexToDelete !== -1) {
                            _lineitem.photos.splice(indexToDelete, 1);
                        }
                    });             
                    $scope.addEditProduct();
                    $scope.imageDeleting[_id] = false;                                   
                })
                .catch(function(error) {                    
                    $scope.imageDeleting[_id] = false;                           
                })
            }
        }

        $scope.deletePSFiles = function(){
            let photos = [];
            if ($scope.productModel && $scope.productModel.photos && $scope.productModel.photos) {
                if ($scope.productModel.photos.length > 0) {    
                    $scope.productModel.photos.forEach(function(file){                           
                        photos.push(file.fileName)
                    })     
                }
                if (photos.length > 0) {
                    AwsS3Utility.deleteFiles(photos)
                    .then(function(data) {
                        // delete
                    })
                    .catch(function(error) {
                        // 
                    })
                }
            } 
        }

        $scope.galleryPhotos = [];
        $scope.imgPathForImgGllery = '';
        $scope.getPhotosArr = function(arr) {
            let newArr = [];
            if (arr.length > 0) {
                arr.forEach(function(item){
                    if (!item.fileName.endsWith('.pdf')) {
                        newArr.push({
                            caption: item.caption,
                            fileName: item.fileName,
                            filePath: item.filePath,
                            isFetchedFromProductsMaster: true
                        })
                    }                  
                })            
                return newArr

            }
            return arr
        }

        $scope.showFullScreenImages = function(index, photosArr, path, type="photo"){        
            if (photosArr.length) {
                angular.forEach(photosArr, function(photo, index) {
                    photo.fullPath = $scope.awsCDNpath + photo.fileName
                })
            }
            $scope.imgPathForImgGllery = path;
            $scope.galleryPhotos = photosArr;
            $(document).bind('keydown', function (e) {
                var ele = document.getElementsByClassName("full-screen-gallery");
                if(ele.length == 0) return;
                var carouselPrev = document.getElementsByClassName("carousel-prev");
                var carouselNext = document.getElementsByClassName("carousel-next");
                switch (e.key) {
                    case 'ArrowLeft':
                        carouselPrev[carouselPrev.length-1].click();
                        break;
                    case 'ArrowRight':
                        carouselNext[carouselNext.length-1].click();
                }
            });
            $scope.imageInitialIndex = index;
            ngDialog.open({
                template: 'PSPicturesGallery.html',
                className: 'ngdialog-theme-default',
                scope: $scope,
                preCloseCallback: function() {
                    $scope.imageInitialIndex = 999;
                }
            });
        }

        $scope.showImageError = function() {
            ngDialog.open({
                template: 'showImageError.html',
                className: 'ngdialog-theme-default',
                scope: $scope,
                preCloseCallback: function() {
    
                }
            });
        }

        $scope.downloadPDFfromLineItem = function(link) {
            window.location.href = link
        }

        $scope.showCaptionInput = function(i){
            var elems = document.querySelectorAll(".quote-li-img-caption-input.show");
            [].forEach.call(elems, function(el) {
                el.classList.remove("show");
            });
            var elems2 = document.querySelectorAll(".quote-li-img-caption-link.hide");
            [].forEach.call(elems2, function(el) {
                el.classList.remove("hide");
            });
            if (document.getElementById('qouteImgInput_'+i+'_caption_input')) {
                document.getElementById('qouteImgInput_'+i+'_caption_input').classList.add('show')
                document.querySelector('#qouteImgInput_'+i+'_caption_input textarea').focus()
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_link')) {
                document.getElementById('qouteImgInput_'+i+'_caption_link').classList.add('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_edit')) {
                document.getElementById('qouteImgInput_'+i+'_caption_edit').classList.add('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_text')) {
                document.getElementById('qouteImgInput_'+i+'_caption_text').classList.add('hide')
            }
        };
        $scope.saveCaption = function(e, photo, i) {
            var _lineitem = $scope.productModel;   
            var _value = e.target.value;
            _lineitem.photos.filter(function(v,i) {
                if (v.fileName === photo.fileName) {
                    v.caption = _value.trim()
                }
            }); 
            var elems = document.querySelectorAll(".quote-li-img-caption-input.show");
            [].forEach.call(elems, function(el) {
                el.classList.remove("show");
            });
            var elems2 = document.querySelectorAll(".quote-li-img-caption-link.hide");
            [].forEach.call(elems2, function(el) {
                el.classList.remove("hide");
            });
            if (document.getElementById('qouteImgInput_'+i+'_caption_input')) {
                document.getElementById('qouteImgInput_'+i+'_caption_input').classList.remove('show')                
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_link')) {
                document.getElementById('qouteImgInput_'+i+'_caption_link').classList.remove('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_edit')) {
                document.getElementById('qouteImgInput_'+i+'_caption_edit').classList.remove('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_text')) {
                document.getElementById('qouteImgInput_'+i+'_caption_text').classList.remove('hide')
            }
            if($scope.isProductEditing){
                $scope.addEditProduct();
                $scope.PSImageProcessing = false;  
            }
        }
        $scope.getSanitizedId = function(string) {        
            const filename = string.match(/\/([^/]+)\.\w+$/)[1];        
            return filename
        }
        $scope.isImageDeleting = function() {
            const isEmpty = Object.keys($scope.imageDeleting).length === 0 && $scope.imageDeleting.constructor === Object;
            let isAnyDeleting = false; 
            if (!isEmpty) {
                isAnyDeleting = Object.values($scope.imageDeleting).every(value => value === true);
            }
            return isAnyDeleting;
        }
        $scope.updateQboMapAccount = function(product, account, type) {
            product[type] = account.accountId;
            if ($scope.isProductEditing) {
                $scope.addEditProduct(type)
            }
        }
        $scope.isPriceLockToggleInProgress = false;
        $scope.isPriceUpdateInProgress = false;
        $scope.isCostUpdateInProgress = false;
        $scope.isMarginUpdateInProgress = false;
        $scope.togglePriceMargin = function(model) {
            $scope.productModel.marginPercentage = null;
            $scope.marginHasError = false;
            model.priceLock = false;
            model.usePriceMargin = !model.usePriceMargin;
            if (model.usePriceMargin) {
                $scope.calculateCPM('toggleOn')
            } else {
                $scope.isMarginChanged = false;
                $scope.productModel.marginPercentage = null;
                if ($scope.isProductEditing) {
                    $scope.addEditProduct('marginPercentage');
                }
            }
        }
        $scope.getItemById = function (id) {
            function findInLevels(category) {
                if (category.id == id) {
                    return category;
                }        
                if (category.level1 && category.level1.length > 0) {
                    for (let level1 of category.level1) {
                        const result = findInLevels(level1);
                        if (result) return result;
                    }
                }
                if (category.level_2 && category.level_2.length > 0) {
                    for (let level2 of category.level_2) {
                        const result = findInLevels(level2);
                        if (result) return result;
                    }
                }
                if (category.level_3 && category.level_3.length > 0) {
                    for (let level3 of category.level_3) {
                        const result = findInLevels(level3);
                        if (result) return result;
                    }
                }
                return null;
            }
            for (let category of $scope.allCategories) {
                const result = findInLevels(category);
                if (result) return result;
            }
            return null;
        };
        $scope.cpmCalculating = false;
        $scope.calculateCPM = function(updatedNode) {
            let isUseMargin = $scope.productModel.usePriceMargin;
            let calculationModel = {
                _cost: null,
                _price: null,
                _margin: null
            }
            let targetedNode = '';
            // if use margin link is ON
            if (isUseMargin) {
                if ($scope.productModel.cost != undefined) {
                    $scope.productModel.cost = $scope.productModel.cost.toString();
                    if ($scope.productModel.cost) {
                        calculationModel._cost = $scope.productModel.cost.replace(/\$|,/g, '');
                        calculationModel._cost = Number(calculationModel._cost)
                    }
                }
                if ($scope.productModel.price != undefined) {
                    $scope.productModel.price = $scope.productModel.price.toString();
                    if ($scope.productModel.price) {
                        calculationModel._price = $scope.productModel.price.replace(/\$|,/g, '');
                        calculationModel._price = Number(calculationModel._price);
                    }
                }
                if ($scope.productModel.marginPercentage != undefined) {
                    $scope.productModel.marginPercentage = $scope.productModel.marginPercentage.toString();
                    if ($scope.productModel.marginPercentage) {
                        calculationModel._margin = $scope.productModel.marginPercentage.replace(/\$|,/g, '');
                        calculationModel._margin = Number(calculationModel._margin);
                    }
                }
                // if cost and margin exist -- update price
                if (calculationModel._cost != null && calculationModel._margin != null && (updatedNode == 'marginPercentage' || updatedNode == 'cost')) {
                    targetedNode = 'updatePrice';
                } 
                // if price and margin exist -- update cost
                else if (calculationModel._price != null && calculationModel._margin != null && (updatedNode == 'marginPercentage' || updatedNode == 'price')) {
                    targetedNode = 'updateCost';
                } 
                // if cost and price exist but margin not exist -- update margin
                else if (calculationModel._cost != null && calculationModel._price != null && (updatedNode == 'cost' || updatedNode == 'price')) {
                    targetedNode = 'updateMargin';
                } 
                // if cost and price exist and use margin toggled ON -- update margin
                else if (calculationModel._cost != null && calculationModel._price != null && (updatedNode == 'toggleOn')) {
                    targetedNode = 'updateMargin';
                } 
                // if margin exist and category (with margin available) selected -- update price/cost
                else if (calculationModel._margin && $scope.productModel.qboCatId != undefined && $scope.productModel.qboCatId != null) {
                    const exists = $scope.getItemById($scope.productModel.qboCatId);
                    if (exists.marginPercentage) {
                        calculationModel._margin = exists.marginPercentage;
                        $scope.productModel.marginPercentage = calculationModel._margin;
                        if (calculationModel._cost != null) {                    
                            targetedNode = 'updatePrice';
                        } else if (calculationModel._price != null) {
                            targetedNode = 'updateCost';
                        }
                    }
                }
                let payload = {};
                if (targetedNode == 'updatePrice') {
                    payload.cost = calculationModel._cost;
                    payload.marginPercentage = calculationModel._margin;
                    payload.hasData = true;
                }
                // if (targetedNode == 'updateCost') {
                //     payload.price = calculationModel._price;
                //     payload.marginPercentage = calculationModel._margin;
                //     payload.hasData = true;
                // }
                // if (targetedNode == 'updateMargin') {
                //     payload.cost = calculationModel._cost;
                //     payload.price = calculationModel._price;
                //     payload.hasData = true;
                // }
                if (payload.marginPercentage && (payload.marginPercentage < 1 || payload.marginPercentage > 9000)) {
                    $scope.marginHasError = true;
                    $scope.errorProductForm = 'Markup must be between 1 and 9000';
                    setTimeout(function(){
                        $scope.errorProductForm = '';
                    }, 2000)
                    return
                }
                if (payload.hasData) {
                    $scope.cpmCalculating = true;
                    delete payload.hasData;
                    apiGateWay.get("/calculate_price", payload).then(function (res) {
                        if (res && res.data) {
                            if (targetedNode == 'updatePrice') {
                                $scope.productModel.price = res.data.price
                            } 
                            // if (targetedNode == 'updateCost') {
                            //     $scope.productModel.cost = res.data.cost
                            // } 
                            // if (targetedNode == 'updateMargin') {
                            //     $scope.productModel.marginPercentage = res.data.marginPercentage > 0 ? res.data.marginPercentage : 0
                            // } 
                        }  
                        $scope.cpmCalculating = false; 
                        if ($scope.isProductEditing) {
                            $scope.addEditProduct('qboCatId');
                        } 
                    }, function (error) {
                        $scope.cpmCalculating = false; 
                    })
                }                
                
            } else {
                $scope.productModel.marginPercentage = null;
            }
        }
        $scope.togglePriceLock = function(model) {
            model.priceLock = !model.priceLock;
            if ($scope.isProductEditing) {
                $scope.addEditProduct('priceLock');
            }
        }
        $scope.blockPasting = function (event) {            
            event.preventDefault();
        };        
        $scope.marginHasError = false;       
        $scope.handleMarginBlurInterval = null;
        $scope.handleMarginBlur = function() {
            $scope.isMarginChanged = true;        
            let _margin = $scope.productModel.marginPercentage;
            if (_margin) {
                _margin = _margin.toString();
                _margin = _margin.replace(/[^0-9]/g, "");
                _margin = Number(_margin);
                if (_margin < 1 || _margin > 9000) {
                    $scope.marginHasError = true;
                    $scope.errorProductForm = 'Markup must be between 1 and 9000';
                    setTimeout(function(){
                        $scope.errorProductForm = '';
                    }, 2000)
                    return
                } else {
                    $scope.marginHasError = false;
                }
            }            
            clearInterval($scope.handleMarginBlurInterval)
            $scope.handleMarginBlurInterval = setTimeout(function(){
                if (!$scope.marginHasError) {
                    if ($scope.isProductEditing) {
                        if ($scope.addSelectedType=='Product' || $scope.addSelectedType=='Service') {
                            $scope.addEditProduct('marginPercentage');                    
                        } else {
                            $scope.openOverWriteMarginCategoryAlert();
                        }
                    } else if ($scope.addSelectedType=='Product' || $scope.addSelectedType=='Service') {
                        $scope.calculateCPM('marginPercentage');
                    }
                }
            }, ($scope.isProductEditing ? 100 : 0))            
        }
        $scope.overWriteMarginCategoryAlert = null;
        $scope.isMarginChanged = false;
        $scope.openOverWriteMarginCategoryAlert = function() {
            $scope.isMarginChanged = false;           
            if ($scope.productModel.marginPercentage == '' && $scope.productModelCache.marginPercentage == null) {
                return
            } else if ($scope.productModel.marginPercentage == null && $scope.productModelCache.marginPercentage == '') {
                return
            }
            if ($scope.productModel.marginPercentage != null && ($scope.productModel.marginPercentage != $scope.productModelCache.marginPercentage)) {
                $scope.isMarginChanged = true;
                $scope.overWriteMarginCategoryAlert = ngDialog.open({
                    template: 'overWriteMarginCategory.html',
                    className: 'ngdialog-theme-default v-center',
                    scope: $scope,
                    closeByDocument: false,
                    preCloseCallback: function() {
                        $scope.productModel.marginPercentage = $scope.productModelCache.marginPercentage;
                        $scope.isMarginChanged = false;
                    }
                })
            }             
        }      
        $scope.overWriteMarginCategoryConfirmed = function() {
            $scope.addEditProduct('marginPercentage');  
            $scope.overWriteMarginCategoryAlert.close(); 
        }     
        $scope.overWriteMarginCategoryCanceled = function() {
            $scope.productModel.marginPercentage = $scope.productModelCache.marginPercentage;
            $scope.overWriteMarginCategoryAlert.close();
        }
        $scope.productAuditLogLoading = false;
        $scope.productAuditLog = [];
        $scope.pageObjProductLog =  {
            currentPage: 1,
            page: '',
            limitInv: 10,
            totalRecord: '',
            totalPage: ''        
        }
        $scope.openProductAuditLog = function() {
            $scope.pageObjProductLog.currentPage = 1;
            $scope.pageObjProductLog.totalRecord = $scope.pageObjProductLog.totalPage = 0;
            $scope.productAuditLogPopup = ngDialog.open({
                template: 'productAuditLog.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByDocument: false,
                preCloseCallback: function() {
                    $scope.productAuditLog = null;
                }
            })
        }
        $scope.getProductAuditLog = function() {
            let jobParam = {
                offset: $scope.pageObjProductLog.currentPage - 1,
                limit: $scope.pageObjProductLog.limitInv,
                sortOrder: $scope.dirInv,
                sortColumn: $scope.columnInv,
                recordId: $scope.productModel.id,
            };
            $scope.productAuditLogLoading = true;
            apiGateWay.get("/get_product_service_audit_logs", jobParam).then(function(response) {
                if (response.data.status == 200) {               
                    let productAuditResponse = response.data.data;
                    $scope.productAuditLog = $rootScope.getShortLastNames(productAuditResponse.data);
                    $scope.pageObjProductLog.totalRecord = productAuditResponse.rows;
                    $scope.pageObjProductLog.totalPage = $scope.pageObjProductLog.totalRecord > 0 ? Math.ceil($scope.pageObjProductLog.totalRecord / $scope.pageObjProductLog.limitInv) : 0;
                }
                $scope.productAuditLogLoading = false;
            }, function(_error){
                $scope.productAuditLogLoading = false;
            });
        }
        $scope.goToAuditPage = function(page) {
            $scope.pageObjProductLog.currentPage = page;
            $scope.getProductAuditLog();
        };
        BroadcastService.onMessage(function(data) {            
            $rootScope.isHeritageEnabled = data.isHeritageEnabled;
        });
        $scope.heritageUnits = [];
        $scope.changeHeritageNumber = function() {
            if ($scope.productModel.heritageNumber == null || $scope.productModel.heritageNumber == '' || $scope.productModel.heritageNumber == undefined) {
                if ($scope.productModel.heritageNumber == $scope.heritageNumberCache) {
                    return;
                }
                $scope.heritageNumberCache = undefined;
                $scope.productModel.heritageUOM = null;
                $scope.showHeritageErrorMsg = false;
                $scope.getHeritageUnits($scope.productModel);
            } else {
                if ($scope.productModel.heritageNumber == $scope.heritageNumberCache) {
                    return;
                }
                $scope.productModel.heritageUOM = null;
                $scope.heritageUnits = [];
                $scope.heritageNumberCache = $scope.productModel.heritageNumber;
                $scope.getHeritageUnits($scope.productModel); 
            }
        }
        $scope.getHeritageUnits = function (product) {
            if ($rootScope.isHeritageEnabled && product.heritageNumber && product.heritageNumber != '' && $scope.heritageUnits.length == 0) {
                apiGateWay.get("/heritage_uom_list", { heritageNumber: product.heritageNumber }).then(function (response) {
                    if (response.data.status == 200) {
                        if (response.data.data.sortedUOMList.length > 0) {
                            $scope.heritageUnits = response.data.data.sortedUOMList;
                            let defaultUOM = response.data.data.defaultUOM;
                            $scope.showHeritageErrorMsg = false;
                            if ($scope.productModel.heritageUOM == undefined || $scope.productModel.heritageUOM == null || $scope.productModel.heritageUOM == '') {
                                $scope.productModel.heritageUOM = defaultUOM;
                                if ($scope.productModel.id) {
                                    $scope.addEditProduct('heritageNumber');
                                }
                            }
                            $scope.invalidHeritageText = "Invalid Heritage Number Entered";
                        } else {
                            $scope.heritageUnits = [];
                            $scope.productModel.heritageUOM = null;
                            if ($scope.productModel.id) {
                                $scope.addEditProduct('heritageNumber');
                            }
                            $scope.showHeritageErrorMsg = true;
                            $scope.invalidHeritageText = "Invalid Heritage Number Entered";
                        }
                    } else {
                        $scope.heritageUnits = [];
                        $scope.productModel.heritageUOM = null;
                        $scope.showHeritageErrorMsg = true;
                        $scope.invalidHeritageText = response.data.message;
                    }
                });
            }
        }
        $scope.heritageUnitUpdate = function(newUnit) {
            $scope.productModel.heritageUOM = newUnit;
            if ($scope.productModel.id) {
                $scope.addEditProduct('heritageUOM');
            }
        }
        
        $scope.makeParentCategory = function() {
            $scope.makingParentCategory = true;
            if ($scope.isProductEditing) {
                $scope.addEditProduct();
            }
        }
    });