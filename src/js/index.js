import $ from 'jquery'
import TopoJSON from 'ol/format/TopoJSON'
import GeoJSON from 'ol/format/GeoJSON'
import Source from 'ol/source/Vector'
import Layer from 'ol/layer/Vector'
import Feature from 'ol/Feature'
import Basemap from 'nyc-lib/nyc/ol/Basemap'
import LocationMgr from 'nyc-lib/nyc/ol/LocationMgr'
import Popup from 'nyc-lib/nyc/ol/FeaturePopup'
import Decorate from 'nyc-lib/nyc/ol/format/Decorate'
import AutoLoad from 'nyc-lib/nyc/ol/source/AutoLoad'
import FeatureTip from 'nyc-lib/nyc/ol/FeatureTip'
import style from './style'
import schema from './schema'

const geo_url = 'https://maps.nyc.gov/geoclient/v1/search.json?app_key=74DF5DB1D7320A9A2&app_id=nyc-lib-example'
const popupHtml = '<div class="feature"></div><div class="btns"><button class="save btn rad-all">Save</button><button class="delete btn rad-all">Delete</button><button class="cancel btn rad-all">Cancel</button></div>'

const map = new Basemap({target: 'map'})
const popup = new Popup({map, layers: []})
const locationMgr = new LocationMgr({map, url: geo_url})
const csclSource = new AutoLoad({
  url: 'data/cscl.json',
  format: new Decorate({
    parentFormat: new TopoJSON({dataProjection: 'EPSG:4326'}),
    decorations: [{
      extendFeature() {
        this.setGeometry(this.getGeometry().transform('EPSG:4326', 'EPSG:3857'))
      }
    }]
  })
})
const csclLayer = new Layer({
  source: csclSource, 
  style: style.cscl,
  zIndex: 20000
})
const source = new Source()
const layer = new Layer({
  source, 
  style: style.closed,
  zIndex: 30000
})

map.addLayer(csclLayer)
map.addLayer(layer)
csclSource.autoLoad().then(() => {
  $('body').removeClass('loading')
  $('#loading').remove()
})
locationMgr.mapLocator.layer.setStyle(style.geocode)

const inputs = (props, prop) => {
  const value = props[prop] || ''
  const result = []
  if (prop.indexOf('date') > -1) {
    const value = props[prop]
    const when = value ? value.split('T') : ['', '']
    const what = prop.split('_')

    const date = $('<div class="prop"></div>')
    date.append($(`<label for="${prop}" class="name">${prop}</span>`))
    date.append($(`<input id="${prop}" class="value" type="date">`).val(when[0]))
    result.push(date)
    
    const time = $('<div class="prop"></div>')
    const timeId = `${what[0]}_${what[1]}_time`
    time.append($(`<label for="${timeId}" class="name">${what[0]}_${what[1]}_time</span>`))
    time.append($(`<input id="${timeId}" class="value" type="time">`).val(when[1]))
    result.push(time)
  } else if (prop.indexOf('time') === -1) {
    const field = $('<div class="prop"></div>')
    field.append($(`<label for="${prop}" class="name">${prop}</span>`))
    field.append($(`<input id="${prop}" class="value">`).val(props[prop]))
    result.push(field)
  }
  return result
}

const editFeature = feature => {
  const props = feature.getProperties()

  feature.html = () => {
    const html = $(popupHtml)
    const props = feature.getProperties()

    Object.keys(schema).forEach(prop => {
      html.first().append(inputs(props, prop))
    })

    html.find('.save').click(() => {
      Object.keys(schema).forEach(prop => {
        if (prop.indexOf('date') > -1) {
          const date = $(`#${prop}`).val()
          const time = $(`#${prop.replace(/date/, 'time')}`).val()
          feature.set(prop, `${date}T${time}Z`)
        } else if (prop === 'evt_desc') {
          feature.set(prop, $(`#${prop}`).val())
        }
      })
      if (feature._addme) {
        source.addFeature(feature)
        feature._addme = false
      }
      popup.hide()
    })

    html.find('.delete').click(() => {
      if (!feature._addme) {
        source.removeFeature(feature)
      }
      popup.hide()
    })

    html.find('.cancel').click(() => {
      popup.hide()
    })

    return html
  }
  popup.feature = feature
  popup.showFeature(feature)
}

map.on('click', event => {
  let feature
  let csclFeature
  map.forEachFeatureAtPixel(event.pixel, (feat, lyr) => {
    if (lyr === layer) {
      feature = feat
    } else if (lyr === csclLayer) {
      csclFeature = feat
    }
  })
  if (!feature && csclFeature) {
    feature = new Feature(csclFeature.getProperties())
    feature._addme = true
  }
  if (feature) {
    editFeature(feature)
  }
})

let photo = false
$('.photo').click(() => {
  photo = !photo
  map[photo ? 'showPhoto' : 'hidePhoto']()
  $('.photo').html(photo ? 'Base Map' : 'Aerial Photo')
})

$('.save-json').click(() => {
  map.saveGeoJson(source, 'street.json')
})

const geoJson = new GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
})
$('.load-json').click(() => {
  const input = $('<input class="file-in" type="file">')
  const reader = new FileReader()
  reader.onload = () => {
    source.clear()
    source.addFeatures(geoJson.readFeatures(reader.result))
  }
  $('body').append(input)
  input.change(event => {
    input.remove()
    reader.readAsText(event.target.files[0])
  })
  input.trigger('click')
})

const boros = {
  '1': 'MANHATTAN',
  '2': 'BRONX',
  '3': 'BROOKLY',
  '4': 'QUEENS',
  '5': 'STATEN ISLAND'
}

const eventsTip = f => {
  return {
    css: 'evt',
    html: $(`<div><strong>${f.get('evt_desc')}</strong></div>`)
      .append(`<div class="evt"><em>${f.get('ST_LABEL')}, ${boros[f.get('BOROCODE')]}</em></div>`)
      .append(`<div class="start">start: ${f.get('evt_start_date')}</div>`)
      .append(`<div class="start">end: ${f.get('evt_end_date')}</div>`)
  }
}

const csclTip = f => {
  return {
    html: $(`<div><strong>${f.get('ST_LABEL')}</strong><br><div>${boros[f.get('BOROCODE')]}</div></div>`)
  }
}

new FeatureTip({
  map,
  tips: [{layer, label: eventsTip}, {layer: csclLayer, label: csclTip}]
})

global.map = map
global.csclSource = csclSource
global.csclLayer = csclLayer
global.source = source
global.layer = layer
global.popup = popup
