
/*
    DMG DATA SET HELPERS:
    The DMG data sets are dynamic, based on which DMGs
    the expert has been assigned surveys from. The
    form of the data sets here is different from the
    Expert/Institution/Specialty data sets, so we need
    several helper functions to do preprocess data and
    update the comparison sets.
*/
// DMG Response needs to be parsed in a special way
// to ensure it is an array of DMGs and merge a DMG's
// potential 2 data sets (completed + pending counts).

class DMGHelper {

  static parseDMGResponse(res) {
      var data = res,
          dmgData = {},
          dmgs = [];
      if (data instanceof Array) {
          data.forEach(function(d){
              if (d) {
                  dmgs.push(d);
              }
          })
      } else if (typeof data === 'object' && data && !data.error) {
          var key, val;
          for (key in data) {
              val = data[key];
              if (val && typeof val === 'object') {
                  dmgs.push(val);
              }
          }
      }
      data = dmgs;
      return data;
  }

  static parseDMGResponseFor (affiliation) {

      return function (response) {
          var res = DMGHelper.parseDMGResponse(response),
              data = res.data || [],
              dmg = null,
              i = 0,
              d = null,
              daff = null;
          while (i < data.length) {
              d = data[i];
              daff = d.subaffiliation1 || d.Subaffiliation1 || d.experience;
              if (daff && DMGHelper.isEqualish(daff, affiliation)) {
                  dmg = d;
                  break;
              }
              i++;
          }
          res.data = dmg;
          return res;
      };

    }

  static extend(a, b, overwrite){
      for(var key in b)
          if(b.hasOwnProperty(key) && (overwrite || !a.hasOwnProperty(key))) {
              a[key] = b[key];
          }
      return a;
  }

  static normalizeDMGName (name) {
      name = name || '';
      return name.split(' ').map(function(s){
          if (/\([^\)]+\)/g.test(s)) {
              return s;
          } else {
              return s.charAt(0) + s.slice(1).toLowerCase();
          }
      }).join(' ');
  }

  static isEqualish (s1, s2) {
      s1 = s1 || '';
      s2 = s2 || '';
      return s1.toLowerCase() === s2.toLowerCase();
  }
}

export default DMGHelper;
