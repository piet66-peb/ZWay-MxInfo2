/**
 * jQuery json-viewer
 * @author: Alexandre Bodelot <alexandre.bodelot@gmail.com>
 * @link: https://github.com/abodelot/jquery.json-viewer
 *
 * enhanced version 2020-07-21/peb: jsonStyle
 * enhanced version 2020-10-02/peb: jsonClick
 *
 * Usage:
 *  devData.isFailed["value"+clickMark] = "javascript:xxxx(yyyy);";
 *  devData.isFailed["value"+styleMark] = "background-color:yellow; color:red; font-weight:bold;";
 *
 * Arrays:
 *  devData.nodeInfoFrame['value'+styleMark] = {i1: "background-color:yellow; color:red; font-weight:bold;",
 *                                              i2: "background-color:yellow; color:red; font-weight:bold;",
 *                                              i3: "background-color:yellow; color:red; font-weight:bold;"};
 */
/*jshint strict: false */
/*globals jQuery */
(function($) {

  /**
   * Check if arg is either an array with at least 1 element, or a dict with at least 1 key
   * @return boolean
   */
  function isCollapsable(arg) {
    return arg instanceof Object && Object.keys(arg).length > 0;
  }

  /**
   * Check if a string represents a valid url
   * @return boolean
   */
  function isUrl(string) {
     var regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
     return regexp.test(string);
  }

  /**
   * Transform a json object into html representation
   * @return string
   */
  function json2html(json, options, jsonStyle, jsonClick) {
    var styleTag = '';
    var taga = '';
    var tage = '';

    if (options.styleTag && jsonStyle) {
      //examlpe
      //styleTag = 'background-color:yellow; color:red; font-weight:bold;';
      styleTag = 'style="'+jsonStyle+';"';
    }

    if (options.clickable && jsonClick) {
      taga = '<a href="'+jsonClick+'">';
      tage = '</a>';
    }

    var html = '';
    if (typeof json === 'string') {
      // Escape tags
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (options.withLinks && isUrl(json)) {
        html += '<a href="' + json + '" class="json-string" target="_blank">' + json + '</a>';
      } else {
        html += taga+'<span '+styleTag+' class="json-string">"' + json + '"</span>'+tage;
      }
    } else if (typeof json === 'number') {
      html += taga+'<span '+styleTag+' class="json-literal">' + json + '</span>'+tage;
    } else if (typeof json === 'boolean') {
      html += taga+'<span '+styleTag+' class="json-literal">' + json + '</span>'+tage;
    } else if (json === null) {
      html += taga+'<span '+styleTag+' class="json-literal">null</span>'+tage;
    } else if (json instanceof Array) {
      if (json.length > 0) {
        html += '[<ol class="json-array">';
        for (var i = 0; i < json.length; ++i) {
          html += '<li>';
          // Add toggle button if item is collapsable
          if (isCollapsable(json[i])) {
            html += '<a href class="json-toggle"></a>';
          }
          //add style to array object
          var jStyle = jsonStyle;
          if (typeof jsonStyle === 'object') {
              jStyle = jsonStyle[i]||false;
          }
          //add click to array object
          var jClick = jsonClick;
          if (typeof jsonClick === 'object') {
              jClick = jsonClick[i];
          }
          html += json2html(json[i], options, jStyle, jClick);
          // Add comma if item is not last
          if (i < json.length - 1) {
            html += ',';
          }
          html += '</li>';
        }
        html += '</ol>]';
      } else {
        html += '[]';
      }
    } else if (typeof json === 'object') {
      var key_count = Object.keys(json).length;
      if (key_count > 0) {
        html += '{<ul class="json-dict">';
        for (var key in json) {
         if (json.hasOwnProperty(key) && 
             (options.styleTag === false && options.clickable === false || 
              key.indexOf(options.styleTag) < 0 && key.indexOf(options.clickable) < 0)) {
            html += '<li>';
            var keyRepr = options.withQuotes ?
              '<span class="json-string">"' + key + '"</span>' : key;
            //a add click ability to key
            // Add toggle button if item is collapsable
            if (isCollapsable(json[key])) {
              html += '<a href class="json-toggle">' + keyRepr + '</a>';
            } else {
              html += keyRepr;
            }
            html += ': ' + json2html(json[key], options, json[key+options.styleTag]||jsonStyle,
                                                         json[key+options.clickable]||jsonClick);
            
            // Add comma if item is not last
            if (--key_count > 0) {
              html += ',';
            }
            html += '</li>';
          } //for
        }
        html += '</ul>}';
      } else {
        html += '{}';
      }
    }
    return html;
  } //json2html

  $.json2html = function(json, options) {
        // Merge user options with default options
        options = Object.assign({}, {
            collapsed: false,
            rootCollapsable: true,
            withQuotes: false,
            withLinks: true,
            styleTag: false,
            clickable: false
        }, options);

      return json2html(json, options, options.styleTag, options.clickable);
  }; //$.json2html

  /**
   * jQuery plugin method
   * @param json: a javascript object
   * @param options: an optional options hash
   */
  $.fn.jsonViewer = function(json, options) {
    // Merge user options with default options
    options = Object.assign({}, {
      collapsed: false,
      rootCollapsable: true,
      withQuotes: false,
      withLinks: true,
      styleTag: false,
      clickable: false
    }, options);

    // jQuery chaining
    return this.each(function() {

      // Transform to HTML
      var html = json2html(json, options, false, false);
      if (options.rootCollapsable && isCollapsable(json)) {
        html = '<a href class="json-toggle"></a>' + html;
      }

      // Insert HTML in target DOM element
      $(this).html(html);
      $(this).addClass('json-document');

      // Bind click on toggle buttons
      $(this).off('click');
      $(this).on('click', 'a.json-toggle', function() {
        var target = $(this).toggleClass('collapsed').siblings('ul.json-dict, ol.json-array');
        target.toggle();
        if (target.is(':visible')) {
          target.siblings('.json-placeholder').remove();
        } else {
          var count = target.children('li').length;
          var placeholder = count + (count > 1 ? ' items' : ' item');
          target.after('<a href class="json-placeholder">' + placeholder + '</a>');
        }
        return false;
      });

      // Simulate click on toggle button when placeholder is clicked
      $(this).on('click', 'a.json-placeholder', function() {
        $(this).siblings('a.json-toggle').click();
        return false;
      });

      if (options.collapsed === true) {
        // Trigger click to collapse all nodes
        $(this).find('a.json-toggle').click();
      }
    });
  };
})(jQuery);
