import Style from 'ol/style/Style'
import RegularShape from 'ol/style/RegularShape'
import Stroke from 'ol/style/Stroke'
import nycOl from 'nyc-lib/nyc/ol'

const geocode = new Style({
  image: new RegularShape({
    stroke: new Stroke({width: 2}),
    points: 4,
    radius: 10,
    radius2: 0,
    angle: 0
  })
})

const cscl = (feature, resolution) => {
  const zoom = nycOl.TILE_GRID.getZForResolution(resolution)
  if (zoom > 14) {
    return new Style({
      stroke: new Stroke({width: 10, color: 'rgba(255,255,0,.1)'})
    })
  }
}

const closed = feature => {
  const now = new Date().toISOString().split('T')[0]
  let end = feature.get('evt_end_date')
  end = (end && end.length > 1) ? end.split('T')[0] : '0000'
  let color = feature._added ? 'rgba(0,0,255,.7)' : 'rgba(0,255,0,.7)'
  if (end < now) {
    color = 'rgba(255,0,0,.7)'
  }
  return new Style({
    stroke: new Stroke({width: 8, color})
  })
}

export default {geocode, cscl, closed}
