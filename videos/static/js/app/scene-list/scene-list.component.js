// Register `phoneList` component, along with its associated controller and template
angular.module('sceneList').component('sceneList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: 'static/js/app/scene-list/scene-list.template.html',
    bindings: {
        mainPage: '=',
        treeFolder: '='
    },
    controller: ['$scope', 'Scene', 'helperService', 'scopeWatchService', 'pagerService', 'Actor', 'Website', 'SceneTag', '$http',
        function SceneListController($scope, Scene, helperService, scopeWatchService, pagerService, Actor, Website, SceneTag, $http, $rootScope) {

            var self = this;
            self.sceneArray = [];

            self.scenesToAdd = [];

            self.pageType = 'Scene';

            self.selectedScenes = [];

            self.selectAllStatus = false;


            self.selectAll = function () {

                self.selectedScenes = [];
                for (var i = 0; i < self.scenes.length; i++) {
                    self.scenes[i].selected = true;
                    self.selectedScenes.push(self.scenes[i].id)
                }

            };


            self.selectNone = function () {

                for (var i = 0; i < self.scenes.length; i++) {
                    self.scenes[i].selected = false;
                }
                self.selectedScenes = [];

            };

            self.sceneSelectToggle = function (scene) {

                var found = false;

                for (var i = 0; i < self.selectedScenes.length; i++) {
                    if (scene.id == self.selectedScenes[i]) {
                        found = true;
                    }

                }

                if (!found) {
                    self.selectedScenes.push(scene.id)

                }

                if (found) {
                    self.selectedScenes.splice(self.selectedScenes.indexOf(scene.id), 1)
                }

                // alert(angular.toJson(self.selectedScenes))

            };


            // $rootScope.$storage = $localStorage;

            self.sceneArraystore = function () {

                // helperService.set(self.sceneArray);
                var scArray = [];
                for (i = 0; i < self.scenes.length; i++) {
                    scArray.push(self.scenes[i].id)
                }

                helperService.set(scArray);
                // $rootScope.$storage.scArray = scArray;

                console.log(helperService.get());
                // self.sceneArray = [];
            };

            self.sceneArrayClear = function () {
                console.log("scene arrray cleared!");
                if (($rootScope.$storage != undefined) && ($rootScope.$storage.scArray != undefined)) {
                    delete $rootScope.$storage.scArray;
                }


            };

            self.nextPage = function (currentPage) {
                // self.sceneArrayClear();
                console.log("scene-list: nextPage function triggered!");

                var input = {
                    currentPage: currentPage,
                    pageType: self.pageType,
                    actor: self.actor,
                    sceneTag: self.sceneTag,
                    website: self.website,
                    folder: self.folder,
                    searchTerm: self.searchTerm,
                    sortBy: self.sortBy,
                    isRunnerUp: self.runnerUp
                };

                self.scrollBusy = true;


                self.actorsToadd = pagerService.getNextPage(input
                );


                self.actorsToadd.$promise.then(function (res) {

                    // self.actorsToadd = res[0];

                    var paginationInfo = {
                        pageType: input.pageType,
                        pageInfo: res[1]
                    };

                    scopeWatchService.paginationInit(paginationInfo);

                    self.scenes = helperService.resourceToArray(res[0]);

                    self.sceneArraystore();


                });


            };


            if (self.mainPage) {
                console.log("main page is true! + " + self.mainPage);
                self.nextPage(0);
            }

            if (self.treeFolder != undefined) {
                self.folder = self.treeFolder;
                self.nextPage(0);
            }

            $scope.$on("paginationChange", function (event, pageInfo) {
                if (pageInfo.pageType == self.pageType) {
                    self.nextPage(pageInfo.page)
                }


            });


            $scope.$on("actorLoaded", function (event, actor) {
                self.actor = actor;

                self.nextPage(0);
            });

            $scope.$on("sceneTagLoaded", function (event, sceneTag) {
                self.sceneTag = sceneTag;
                self.nextPage(0);
            });


            var findIndexOfSceneInList = function (sceneToFind) {
                var found = false;
                var ans = null;
                for (var i = 0; i < self.scenes.length && !found; i++) {
                    if (sceneToFind == self.scenes[i].id) {
                        found = true;
                        ans = i
                    }
                }
                return ans;

            };


            self.updateScenesOnRemove = function (scenes, itemToRemove, typeOfItemToRemove) {

                var resId = [];
                var resObj = [];

                for (var j = 0; j < scenes.length; j++) {

                    var sceneIndex = findIndexOfSceneInList(scenes[j]);


                    for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToRemove].length; i++) {
                        if (itemToRemove.id != self.scenes[sceneIndex][typeOfItemToRemove][i].id) {
                            resId.push(self.scenes[sceneIndex][typeOfItemToRemove][i].id);
                            resObj.push(self.scenes[sceneIndex][typeOfItemToRemove][i]);
                        }
                    }

                    self.scenes[sceneIndex][typeOfItemToRemove] = resObj;

                    resObj = [];

                }

                return resId


            };

            self.removeItem = function (scene, itemToRemove, typeOfItemToRemove) {


                var resId = [];


                if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {

                    self.updateScenesOnRemove(self.selectedScenes, itemToRemove, typeOfItemToRemove)
                } else {
                    var scenes = [];
                    scenes.push(scene.id);
                    resId = self.updateScenesOnRemove(scenes, itemToRemove, typeOfItemToRemove)
                }

                var sceneIndex = findIndexOfSceneInList(scene.id);


                if (self.selectedScenes.length > 0) {
                    var itToRemove = [];
                    itToRemove.push(itemToRemove.id);
                    self.patchScene(self.scenes[sceneIndex].id, typeOfItemToRemove, itToRemove, 'remove', true)
                } else {
                    self.patchScene(self.scenes[sceneIndex].id, typeOfItemToRemove, resId, 'remove', false)
                }


                self.selectNone()


            };

            var updateSceneOnPageOnAdd = function (sceneIndex, typeOfItemToAdd, itemToAdd) {

                var found = false;
                for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToAdd].length && !found; i++) {
                    if (self.scenes[sceneIndex][typeOfItemToAdd][i].id == itemToAdd.id) {
                        found = true;
                    }
                }

                if (!found) {
                    self.scenes[sceneIndex][typeOfItemToAdd].push(itemToAdd);
                }
            };

            var updateScenesOnPageOnAdd = function (itemToAdd, typeOfItemToAdd) {

                for (var i = 0; i < self.selectedScenes.length; i++) {

                    var sceneIndex = findIndexOfSceneInList(self.selectedScenes[i]);
                    updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd);


                }
            };

            var checkIfSceneSelected = function (scene) {
                var found = false;
                for (var i = 0; i < self.selectedScenes.length && !found; i++) {
                    if (scene.id == self.selectedScenes[i]) {
                        found = true;
                    }

                }

                return found

            };


            self.addItem = function (scene, itemToAdd, typeOfItemToAdd) {

                var sceneIndex = findIndexOfSceneInList(scene.id);

                if (self.scenes[sceneIndex][typeOfItemToAdd] == undefined) {
                    self.scenes[sceneIndex][typeOfItemToAdd] = [];
                }


                if (itemToAdd.id != '-1') {





                    // console.log(self.scenes[sceneIndex][typeOfItemToAdd].indexOf(itemToAdd));
                    // if (self.scenes[sceneIndex][typeOfItemToAdd].indexOf(itemToAdd) == '-1'){
                    //     self.scenes[sceneIndex][typeOfItemToAdd].push(itemToAdd);
                    // }

                    var patchData = [];
                    if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                        updateScenesOnPageOnAdd(itemToAdd, typeOfItemToAdd);


                        patchData.push(itemToAdd.id);


                        self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', true)
                    } else {
                        updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd);


                        for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToAdd].length; i++) {
                            patchData.push(self.scenes[sceneIndex][typeOfItemToAdd][i].id);
                        }

                        self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', false)
                    }


                } else {
                    var newItem;
                    if (typeOfItemToAdd == 'actors') {
                        newItem = new Actor();
                        newItem.thumbnail = 'media/images/actor/Unknown/profile/profile.jpg'; //need to change this to a constant!
                        newItem.scenes = [];
                    } else if (typeOfItemToAdd == 'scene_tags') {
                        newItem = new SceneTag();
                        newItem.scenes = [];
                        newItem.websites = [];
                    } else if (typeOfItemToAdd == 'websites') {
                        newItem = new Website;
                        newItem.scenes = [];
                    }

                    newItem.name = itemToAdd.value;

                    newItem.$save().then(function (res) {


                        // self.scenes[sceneIndex][typeOfItemToAdd].push(res);
                        //
                        // var patchData = [];
                        // for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToAdd].length; i++) {
                        //     patchData.push(self.scenes[sceneIndex][typeOfItemToAdd][i].id);
                        // }
                        //
                        // if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                        //     updateScenesOnPageOnAdd(itemToAdd, typeOfItemToAdd);
                        //     self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', true)
                        // } else {
                        //     updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd);
                        //     self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', false)
                        // }

                        // self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add');

                        // self.updateActor(self.actor);

                        var patchData = [];
                        if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                            updateScenesOnPageOnAdd(res, typeOfItemToAdd);


                            patchData.push(res.id);


                            self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', true)
                        } else {
                            updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, res);


                            for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToAdd].length; i++) {
                                patchData.push(self.scenes[sceneIndex][typeOfItemToAdd][i].id);
                            }

                            self.patchScene(scene.id, typeOfItemToAdd, patchData, 'add', false)
                        }


                    })
                }


            };

            self.patchScene = function (sceneToPatchId, patchType, patchData, addOrRemove, multiple) {

                var type = {};
                type[patchType] = patchData;


                if (multiple) {

                    $http.post('tag-multiple-items/', {
                        params: {
                            type: 'scene',
                            patchType: patchType,
                            patchData: patchData,
                            itemsToUpdate: self.selectedScenes,
                            addOrRemove: addOrRemove
                        }
                    }).then(function (response) {
                        console.log("Update finished successfully")
                    }, function errorCallback(response) {
                        alert("Something went wrong!");
                    });


                } else {
                    Scene.patch({sceneId: sceneToPatchId}, type)
                }


            };

            // $scope.$on("sceneTagSelected", function (event, object) {
            //
            // };

            $scope.$on("actorSelected", function (event, object) {

                var selectedObject = object['selectedObject'];
                var originalObject = object['originalObject'];

                self.addItem(originalObject, selectedObject, 'actors');

            });


            $scope.$on("sceneTagSelected", function (event, object) {

                var selectedObject = object['selectedObject'];
                var originalObject = object['originalObject'];

                self.addItem(originalObject, selectedObject, 'scene_tags');

            });

            $scope.$on("websiteSelected", function (event, object) {

                var selectedWebsite = object['selectedObject'];
                var scene = object['originalObject'];

                self.addItem(scene, selectedWebsite, 'websites');


            });

            $scope.$on("websiteLoaded", function (event, website) {
                self.website = website;
                self.nextPage(0);
            });

            $scope.$on("folderOpened", function (event, folder) {
                console.log("scene-list: folderOpened broadcast was caught");
                self.scenes = [];
                self.folder = folder;
                // self.scenes = [];
                self.nextPage(0);
            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                self.scenes = [];
                self.searchTerm = searchTerm;
                self.nextPage(0);

            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                console.log("Sort Order Changed!");
                self.scenes = [];
                self.sortBy = sortOrder;
                self.nextPage(0);
            });

            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                console.log("Sort Order Changed!");
                self.scenes = [];
                self.runnerUp = runnerUp;

                self.nextPage(0);
            });


            self.sceneRunnerUpToggle = function (scene) {

                self.patchScene(scene.id, 'is_runner_up', scene.is_runner_up, 'add', false)

            };


            self.sceneArrayPush = function (sceneId) {

                self.sceneArray.push(sceneId);
                // console.log("Scene-List: sceneArray is:" +  angular.toJson(self.sceneArray))
            };

            self.playScene = function (scene) {

                return $http.get('play-scene/', {
                    params: {
                        sceneId: scene.id
                    }
                })
            };


        }
    ]
});