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

const closed = new Style({
  stroke: new Stroke({width: 5, color: '#803D8D'})
})

export default {geocode, cscl, closed}