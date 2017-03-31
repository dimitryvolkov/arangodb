/* jshint strict: false, sub: true */
/* global */
'use strict';

// //////////////////////////////////////////////////////////////////////////////
// / DISCLAIMER
// /
// / Copyright 2016 ArangoDB GmbH, Cologne, Germany
// / Copyright 2014 triagens GmbH, Cologne, Germany
// /
// / Licensed under the Apache License, Version 2.0 (the "License")
// / you may not use this file except in compliance with the License.
// / You may obtain a copy of the License at
// /
// /     http://www.apache.org/licenses/LICENSE-2.0
// /
// / Unless required by applicable law or agreed to in writing, software
// / distributed under the License is distributed on an "AS IS" BASIS,
// / WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// / See the License for the specific language governing permissions and
// / limitations under the License.
// /
// / Copyright holder is ArangoDB GmbH, Cologne, Germany
// /
// / @author Max Neunhoeffer
// //////////////////////////////////////////////////////////////////////////////

const functionsDocumentation = {
  'replication_ongoing': 'replication ongoing tests',
  'replication_static': 'replication static tests',
  'replication_sync': 'replication sync tests'
};
const optionsDocumentation = [
];

const pu = require('@arangodb/process-utils');
const tu = require('@arangodb/test-utils');

// //////////////////////////////////////////////////////////////////////////////
// / @brief TEST: replication_ongoing
// //////////////////////////////////////////////////////////////////////////////

function replicationOngoing (options) {
  let testCases = tu.scanTestPath('js/server/tests/replication/');

  let localOptions = options;
  localOptions.replication = true;
  localOptions.test = 'replication-ongoing';
  let startStopHandlers = {
    postStart: function (options,
                         serverOptions,
                         instanceInfo,
                         customInstanceInfos,
                         startStopHandlers) {
      let message;
      let slave = pu.startInstance('tcp', options, {}, 'slave_sync');
      let state = (typeof slave === 'object');

      if (state) {
        message = 'failed to start slave instance!';
      }

      return {
        instanceInfo: slave,
        message: message,
        state: state,
        env: {
          'flatCommands': slave.endpoint
        }
      };
    },

    preShutdown: function (options,
                           serverOptions,
                           instanceInfo,
                           customInstanceInfos,
                           startStopHandlers) {
      pu.shutdownInstance(customInstanceInfos.preStart.instanceInfo, options);
    }
  };

  return tu.performTests(localOptions, testCases, 'replication_sync', tu.runInArangosh, {}, startStopHandlers);
}

// //////////////////////////////////////////////////////////////////////////////
// / @brief TEST: replication_static
// //////////////////////////////////////////////////////////////////////////////

function replicationStatic (options) {
  let testCases = tu.scanTestPath('js/server/tests/replication/');

  let localOptions = options;
  localOptions.replication = true;
  localOptions.test = 'replication-static';
  let startStopHandlers = {
    postStart: function (options,
                         serverOptions,
                         instanceInfo,
                         customInstanceInfos,
                         startStopHandlers) {
      let message;
      let res = true;
      let slave = pu.startInstance('tcp', options, {}, 'slave_sync');
      let state = (typeof slave === 'object');

      if (state) {
        res = pu.run.arangoshCmd(options, instanceInfo, {}, [
          '--javascript.execute-string',
          `
          var users = require("@arangodb/users");
          users.save("replicator-user", "replicator-password", true);
          users.grantDatabase("replicator-user", "_system");
          users.reload();
          `
        ]);

        state = res.status;
        if (!state) {
          message = 'failed to setup slave connection' + res.message;
          pu.shutdownInstance(slave, options);
        }
      } else {
        message = 'failed to start slave instance!';
      }

      return {
        instanceInfo: slave,
        message: message,
        state: state,
        env: {
          'flatCommands': slave.endpoint
        }
      };
    },

    preShutdown: function (options,
                           serverOptions,
                           instanceInfo,
                           customInstanceInfos,
                           startStopHandlers) {
      pu.shutdownInstance(customInstanceInfos.preStart.instanceInfo, options);
    }
  };

  return tu.performTests(
    localOptions,
    testCases,
    'master_static',
    tu.runInArangosh,
    {
      'server.authentication': 'true'
    },
    startStopHandlers);
}

// //////////////////////////////////////////////////////////////////////////////
// / @brief TEST: replication_sync
// //////////////////////////////////////////////////////////////////////////////

function replicationSync (options) {
  let testCases = tu.scanTestPath('js/server/tests/replication/');

  let localOptions = options;
  localOptions.replication = true;
  localOptions.test = 'replication-sync';
  let startStopHandlers = {
    postStart: function (options,
                         serverOptions,
                         instanceInfo,
                         customInstanceInfos,
                         startStopHandlers) {
      let message;
      let res = true;
      let slave = pu.startInstance('tcp', options, {}, 'slave_sync');
      let state = (typeof slave === 'object');

      if (state) {
        res = pu.run.arangoshCmd(options, instanceInfo, {}, [
          '--javascript.execute-string',
          `
          var users = require("@arangodb/users");
          users.save("replicator-user", "replicator-password", true);
          users.reload();
          `
        ]);

        state = res.status;
        if (!state) {
          message = 'failed to setup slave connection' + res.message;
          pu.shutdownInstance(slave, options);
        }
      } else {
        message = 'failed to start slave instance!';
      }

      return {
        instanceInfo: slave,
        message: message,
        state: state,
        env: {
          'flatCommands': slave.endpoint
        }
      };
    },

    preShutdown: function (options,
                           serverOptions,
                           instanceInfo,
                           customInstanceInfos,
                           startStopHandlers) {
      pu.shutdownInstance(customInstanceInfos.preStart.instanceInfo, options);
    }
  };

  return tu.performTests(localOptions, testCases, 'replication_sync', tu.runInArangosh, {}, startStopHandlers);
}

function setup (testFns, defaultFns, opts, fnDocs, optionsDoc) {
  testFns['replication_ongoing'] = replicationOngoing;
  testFns['replication_static'] = replicationStatic;
  testFns['replication_sync'] = replicationSync;
  for (var attrname in functionsDocumentation) { fnDocs[attrname] = functionsDocumentation[attrname]; }
  for (var i = 0; i < optionsDocumentation.length; i++) { optionsDoc.push(optionsDocumentation[i]); }
}

exports.setup = setup;