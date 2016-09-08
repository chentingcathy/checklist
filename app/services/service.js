/**
 * http://usejsdoc.org/
 */
module.service('callingURL', function () {
    var callingURL = [];
    this.setCallingURL = function (path) {
        callingURL.push(path);
        console.log("CALLINGURL: ", path, callingURL);
    };

    this.getOriginalURL = function () {
        var prev = callingURL[0];
        console.log("PREVURL:", prev);
        return prev;
    };
});

module.service('UserData', ['$rootScope', '$location', '$http', function ($rootScope, $location, $http) {

    var urlPath = '/app/partials/';

    var migrationTargets = {
        'V5.2': 'IBM Enterprise COBOL for z/OS, V5.2',
        'V6.1': 'IBM Enterprise COBOL for z/OS, V6.1',
    };



    var links = {
    	firewallsup: 'https://www-03preprod.ibm.com/support/knowledgecenter/SSAUBV/com.ibm.omegamon_share.doc_6.3.0.2/zcommonconfig/plan_commcomponents_firewall_cpcg.htm',
        nameconvention:'http://www.ibm.com/support/knowledgecenter/SSRLD6_7.0.0/com.ibm.omegamon.mes.doc_7.0/zosconfigguide70046.htm',
        portassign:'http://www.ibm.com/support/knowledgecenter/SSAUBV/com.ibm.omegamon_share.doc_6.3.0.2/zcommonconfig/plan_commcomponents_ports_cpcg.htm',
//        cobolCafe: 'https://www.ibm.com/developerworks/community/forums/html/forum?id=11111111-0000-0000-0000-000000002281',
//        pdseLoadlib: 'http://www-01.ibm.com/support/docview.wss?uid=swg27041176',
//        V370srcUpgrade: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/migrate/igymch1400.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/igymch1400.html',
//        },
//        OSVSsrcUpgrade: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/migrate/igymch1000.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/igymch1000.html',
//        },
//        VSIIsrcUpgrade: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/migrate/igymch1200.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/igymch1200.html',
//        },
//        enterpriseSrcUpgrade: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/migrate/igymuv3.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/igymuv3.html',
//        },
//        CICSconversion: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/migrate/igymch1700.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/igymch1700.html',
//        },
//        defaultCompilerOption: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/custom/igycch200.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/custom/igycch200.html',
//        },
//        modifyCompilerOptions: {
//            'V5.2': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_5.2.0/com.ibm.cobol52.ent.doc/custom/igycch102.html',
//            'V6.1': 'http://www.ibm.com/support/knowledgecenter/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/custom/igycch102.html',
//        },
//        UpgradeSwHwLevels: {
//            'V5.2': 'http://publibz.boulder.ibm.com/epubs/pdf/i1191812.pdf',
//            'V6.1': 'http://publibz.boulder.ibm.com/epubs/pdf/i1345320.pdf',
//        },
//        ptf: 'http://www.ibm.com/support/knowledgecenter/#!/SS6SG3_6.1.0/com.ibm.cobol61.ent.doc/migrate/mg5apar.html',
    };

    //=============================================================setup default links;
    var userDocumentationLinks = {};

    //==============================================================target传递过来的是版本号
    var prepareDocumentationLinks = function (target) {

        //==========================================================links是文内外链接，各版本所对应的链接，就在上面
        for (var key in links) {
            var value = links[key];
            if (angular.isObject(value)) {
                userDocumentationLinks[key] = value[target];
            } else {
                userDocumentationLinks[key] = value;
            }
        }
    };


    //===============================================================这是关键页标题第二行，在mainpages的辗转调用
    this.pageTitles = {
        support: 'Pre-installation Support',
        progress: 'Pre-installation Progress Report',
        'possible-defect': 'Pre-installation Issue Detected',
        'Checklist-complete': 'Pre-installation Checklist Completed',
    };

    // list of urls in order of migration steps

    //================================================================每一步骤的HTML
    var urls = [
        'Before-you-begin.html',
        'Locate-and-configure-your-firewall.html',
        'Consider-NAT-limitations.html',
        'Determine-the-location-of-the-hub-monitoring-server.html',
        'Verify-the-network-connectivity.html',
        'Name-VTAM-APPLIDs.html',
        'Review-the-following-TCP-related-requirements.html',
//        'Convert-PDS-load-libraries.html',
//        'Check-OS_VS-COBOL-dependencies.html',
//        'Complete-language-environment-migration.html',
//        'Upgrade-software-and-hardware-levels.html',
//        'Install-all-prerequisite-service-updates.html',
//        'Verify-region-sizes.html',
//        'Back-up-old-COBOL-compiler.html',
//        'Install-new-COBOL-compiler.html',
//        'Set-default-compiler-options.html',
//        'Update-COBOL-source-code.html',
//        'Regression-testing.html',
//        'Verify-migration-process.html',
//        'Post-migration-actions.html',
    ];
//==========================================================step 4  里面用到的文字==================//
    var networkChecklists = {
        LPAR: 'Ensure there is network connectivity between all LPARs and between each LPAR.',
        COMPONENTS: 'Ensure there is network connectivity between each LPAR and distributed systems where components will be installed.',
        PORTS: 'Ensure there are available ports between all components.',
        
    };

    /* data saved in db
            'progress': {
                'migrationTarget': UserData.getUserMigrationTarget(),
                'migrationStep': pageIndex + 1,
                'migrationInstructions': $scope.steps
            }
    */


    //=====================================================================初始化自定义版本信号
    var userMigrationTarget = 'V6.1'; // default migration target
    var migrationStep = 0;
    var migrationInstructionPages = [];



    //=======================================================================target传递过来的是版本号
    var updateMigrationTarget = function (target) {
        userMigrationTarget = target;
        //===================================================================准备好各版本对应用到的外链接信息
        prepareDocumentationLinks(target);
        $rootScope.$broadcast('userMigrationTarget.update');
    };


    //======================================================================新开进度时的初始化
    var initData = function () {
        console.log("initializing migration progress data.....");
        migrationInstructionPages = [];
        migrationStep = 0;
        userMigrationTarget = 'V6.1';
        //=================================================================urls是每一步骤的html
        urls.forEach(function (url, index) {
            //=============================================================把'Select-migration-target.html'从0到倒数第五个字符赋给urlstring
            var urlString = url.slice(0, -5);
            //==============================================================slug是urlstring的小写版
            var slug = urlString.toLowerCase();
            migrationInstructionPages.push({
                slug: slug,
                step: index + 1,
                //==========================================================我猜是用空格替换title中的-
                title: urlString.replace(/-/g, ' ').replace(/_/g, '/'),
                // ==========================================================urlPath = '/app/partials/'
                url: urlPath + url,
                status: null,
                completion: 0,
                response: null,
            });
        });
        migrationInstructionPages[0].linkEnabled = true;
        $rootScope.$broadcast('migrationStatus.update');
    };

    //    initData(); // default migration pages

    // db queries
    this.getProgress = $http.get("/cloudant/getprogress")
        .success(function (data) {
            if (data != '0') {
                console.log('getPorgress data:', data);
                updateMigrationTarget(data.progress.migrationTarget);
                migrationStep = data.progress.migrationStep;
                migrationInstructionPages = data.progress.migrationInstructions;
                $rootScope.$broadcast('migrationStatus.update');
            } else {
                // build the migration step page
                initData();
            }
        });

    this.saveProgress = function () {
        // send progress data to database
        //        $rootScope.$broadcast('migrationStep.update');
        //        if (!$rootScope.authentication_id) return;
        if ($rootScope.authentication_id) {
            var data = ({
                'id': $rootScope.authentication_id._json.uniqueSecurityName,
                'progress': {
                    //                'userID': $rootScope.authentication_id.id,
                    'migrationTarget': userMigrationTarget,
                    'migrationStep': migrationStep,
                    'migrationInstructions': migrationInstructionPages
                }
            });
            console.log("saving the following:", data);
            $http.post("/cloudant/saveprogress", data).success(function (status) {
                console.log('Data posted successfully:', status);
            }).error(function (err) {
                console.log('error posting to db: ', err);
            });
        }
    };

    this.deleteProgress = function () {
        console.log("deleteProgress data!");
        var id = $rootScope.authentication_id._json.uniqueSecurityName;
        initData();
    };

    //end of database queries


    this.setUserMigrationTarget = function (target) {
        updateMigrationTarget(target);
    };

    this.getUserDocumentationLinks = function () {
        return userDocumentationLinks;
    }

    this.getnetworkChecklists = function () {
        return networkChecklists;
    }

    // get list of valid migration targets
    this.getMigrationTargets = function () {
        return migrationTargets;
    }

    // update the steps the user has completed
    this.updateStatus = function (slug, value, response) {
        migrationInstructionPages.find(function (page) {
            if (page.slug == slug) {
                page.status = value;
                page.completion = true;
                page.response = response;
                migrationStep = (page.step < migrationInstructionPages.length) ? page.step : page.step - 1;
            }
        });
        $rootScope.$broadcast('migrationStatus.update');
        this.saveProgress();
    };

    this.getUserMigrationTarget = function () {
        return userMigrationTarget;
    };

    this.getMigrationInstructionPage = function (slug) {
        var page = migrationInstructionPages.find(function (page) {
            return page.slug == slug;
        });
        if (!page) {
            // TODO: handle error: 404 page
            $location.path('/' + slug);
        }
        return page;
    };

    this.getMigrationInstructionPages = function () {
        return migrationInstructionPages;
    };

    this.getIndex = function (slug) {
        for (var i = 0; i < migrationInstructionPages.length; i++) {
            if (migrationInstructionPages[i].slug == slug) {
                return i;
            }
        }
        return null;
    };

    this.setLinkActive = function (slug) {
        migrationInstructionPages.find(function (page) {
            if (page.slug == slug) {
                page.state = "active";
                page.linkEnabled = true;
            } else {
                page.state = '';
            }
        });
        $rootScope.$broadcast('migrationStatus.update');
    };

    //走到第几步了，get步骤信息
    this.getMigrationStep = function () {
        console.log("getMigrationStep: migration step = ", migrationStep);
        return '/migration/' + migrationInstructionPages[migrationStep].slug;
    };

}]);
