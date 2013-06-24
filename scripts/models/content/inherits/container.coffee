define [
  'jquery'
  'underscore'
  'backbone'
  'cs!models/content/inherits/base'
], ($, _, Backbone, BaseModel) ->

  Container = Backbone.Collection.extend
    findMatch: (model) ->
      return _.find @titles, (obj) ->
        return model.id is obj.id or model.cid is obj.id

    getTitle: (model) ->
      return @findMatch(model)?.title

    setTitle: (model, title) ->
      match = @findMatch(model)

      if match
        match.title = title
      else
        @titles.push
          id: model.id or model.cid
          mediaType: model.mediaType
          title: title

      model.trigger('change')

  return BaseModel.extend
    mediaType: 'application/vnd.org.cnx.folder'
    accept: []
    unique: true
    branch: true
    expanded: false

    toJSON: () ->
      json = BaseModel::toJSON.apply(@, arguments)

      contents = @get('contents')

      json.contents = []
      _.each contents.models, (item) ->
        obj = {}
        title = contents.getTitle(item)
        if item.id then obj.id = item.id
        if title then obj.title = title

        json.contents.push(obj)

      return json

    accepts: (mediaType) ->
      if (typeof mediaType is 'string')
        return _.indexOf(@accept, mediaType) is not -1

      return @accept

    initialize: (attrs) ->
      @loading = true
      @fetch
        silent: true
        loading: true
        success: (model, response, options) =>
          @loading = false

    add: (models, options) ->
      if (!_.isArray(models)) then (models = if models then [models] else [])

      _.each models, (model, index, arr) =>
        contents = @get('contents')

        if contents.length and not options?.loading
          @get('contents').unshift(model)
        else
          @get('contents').add(model)

      if not options?.silent then @trigger('change')

      return @

    set: (key, val, options) ->
      if (key == null) then return this;

      if typeof key is 'object'
        attrs = key
        options = val
      else
        (attrs = {})[key] = val

      options = options || {}
      contents = attrs.contents
      attrs.contents = @get('contents') or new Container()

      if contents
        @get('contents').titles = contents

        require ['cs!collections/content'], (content) =>
          content.loading().done () =>
            _.each contents, (item) =>
              @add(content.get({id: item.id}), options)
            @trigger('change:contents')

      return Backbone.Model::set.call(@, attrs, options)

    contentView: (callback) ->
      require ['cs!views/workspace/content/search-results'], (View) =>
        view = new View({collection: @get('contents')})
        callback(view)

    sidebarView: (callback) ->
      require ['cs!views/workspace/sidebar/toc'], (View) =>
        view = new View
          collection: @get('contents')
          model: @
        callback(view)
