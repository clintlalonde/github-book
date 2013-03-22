// Generated by CoffeeScript 1.3.3
(function() {

  define(['underscore', 'backbone', 'bookish/controller', 'bookish/models', 'bookish/views', 'bookish/media-types', 'bookish/auth', 'hbs!atc-nav-serialize', 'css!bookish'], function(_, Backbone, Controller, Models, Views, MEDIA_TYPES, Auth, NAV_SERIALIZE) {
    var AtcWorkspace, DEBUG, Folder, ROOT_URL, STORED_KEYS, WORKSPACE_URL, oldBaseBook_initialize, resetDesktop,
      _this = this;
    DEBUG = true;
    ROOT_URL = 'http://beta.cnx.org';
    WORKSPACE_URL = "" + ROOT_URL + "/workspace/";
    Auth.url = function() {
      return "" + ROOT_URL + "/me/";
    };
    Auth.fetch();
    Models.BaseContent.prototype.url = function() {
      if (this.isNew()) {
        return "" + ROOT_URL + "/module/";
      }
      return "" + ROOT_URL + "/module/" + this.id;
    };
    Models.BaseBook.prototype.url = function() {
      return "" + ROOT_URL + "/collection/" + this.id;
    };
    oldBaseBook_initialize = Models.BaseBook.prototype.initialize;
    Models.BaseBook.prototype.initialize = function() {
      var _this = this;
      oldBaseBook_initialize.apply(this, arguments);
      return this.on('change:navTreeStr', function(model, navTreeStr) {
        return _this.set({
          body: NAV_SERIALIZE(JSON.parse(navTreeStr))
        });
      });
    };
    Backbone.ajax = function(config) {
      config = _.extend(config, {
        headers: {
          'REMOTE_USERURI': 'cnxuser:75e06194-baee-4395-8e1a-566b656f6920'
        }
      });
      return Backbone.$.ajax.apply(Backbone.$, [config]);
    };
    Folder = Models.Deferrable.extend({
      mediaType: 'application/vnd.org.cnx.folder',
      url: function() {
        return "" + ROOT_URL + "/folder/" + this.id;
      },
      parse: function(obj) {
        var Type, item, model, models;
        models = (function() {
          var _i, _len, _ref, _results;
          _ref = obj.body || [];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            Type = MEDIA_TYPES.get(item.mediaType).constructor;
            model = new Type(item);
            _results.push(model);
          }
          return _results;
        })();
        this.collection.reset(models);
        delete obj.body;
        return obj;
      },
      initialize: function(obj) {
        var Type, item, model, _i, _len, _ref, _results;
        this.collection = new Backbone.Collection();
        _ref = obj.body || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          Type = MEDIA_TYPES.get(item.mediaType).constructor;
          model = new Type(item);
          _results.push(this.collection.add(model));
        }
        return _results;
      }
    });
    MEDIA_TYPES.add('application/vnd.org.cnx.folder', {
      constructor: Folder,
      editAction: function(model) {
        var mainArea, mainSidebar, mainToolbar, view, workspace,
          _this = this;
        window.scrollTo(0, 0);
        mainSidebar = Controller.mainLayout.sidebar;
        mainToolbar = Controller.mainLayout.toolbar;
        mainArea = Controller.mainLayout.area;
        mainSidebar.close();
        mainToolbar.close();
        workspace = new Models.FilteredCollection(null, {
          collection: model.collection
        });
        view = new Views.SearchBoxView({
          model: workspace
        });
        mainToolbar.show(view);
        view = new Views.SearchResultsView({
          collection: workspace
        });
        mainArea.show(view);
        return model.loaded().done(function() {
          return Backbone.history.navigate("content/" + (model.get('id')));
        });
      }
    });
    AtcWorkspace = Models.DeferrableCollection.extend({
      url: WORKSPACE_URL,
      parse: function(results) {
        var ContentType, item, model;
        results = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = results.length; _i < _len; _i++) {
            item = results[_i];
            ContentType = MEDIA_TYPES.get(item.mediaType).constructor;
            model = new ContentType(item);
            _results.push(model);
          }
          return _results;
        })();
        return results;
      },
      initialize: function() {
        var _this = this;
        this.on('add', function(model) {
          return Models.ALL_CONTENT.add(model);
        });
        this.on('reset', function(collection) {
          return Models.ALL_CONTENT.add(_this.models);
        });
        return this.listenTo(Models.ALL_CONTENT, 'add', function(model) {
          return _this.add(model);
        });
      }
    });
    Models.WORKSPACE = new AtcWorkspace();
    resetDesktop = function() {
      Models.ALL_CONTENT.reset();
      Models.WORKSPACE.fetch();
      if (!Backbone.History.started) {
        Controller.start();
      }
      return Backbone.history.navigate('workspace');
    };
    STORED_KEYS = ['username', 'password'];
    Auth.on('change', function() {
      if (!_.isEmpty(_.pick(Auth.changed, STORED_KEYS))) {
        if (Auth.get('password') && !Auth.previousAttributes()['password']) {
          return;
        }
        return resetDesktop();
      }
    });
    if (!Backbone.History.started) {
      Controller.start();
    }
    return Backbone.history.navigate('workspace');
  });

}).call(this);
