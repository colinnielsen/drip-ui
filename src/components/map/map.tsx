import { isStorefront } from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { Popup, StyleSpecification } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker } from 'react-map-gl';

export default function HomePageMap({ shops }: { shops: Shop[] }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAP_BOX_TOKEN}
      initialViewState={{
        longitude: -73.970866,
        latitude: 40.716146,
        zoom: 2,
      }}
      attributionControl={false}
      customAttribution={''}
      style={{ width: '100%', height: '245px' }}
      mapStyle={mapStyle}
    >
      {shops.map(shop => {
        if (!isStorefront(shop) || shop.location === null) return null;
        return (
          <Marker
            key={shop.id}
            latitude={shop.location.coords[0]}
            longitude={shop.location.coords[1]}
            anchor="bottom"
            color="#000000"
            popup={new Popup({
              className:
                'p-6 font-libreFranklin font-semibold align-middle text-md',
            }).setHTML(shop.label)}
          />
        );
      })}
    </Map>
  );
}

const mapStyle: StyleSpecification = {
  version: 8,
  name: 'Basic',
  metadata: {
    'mapbox:autocomposite': true,
  },
  sources: {
    mapbox: {
      url: 'mapbox://mapbox.mapbox-streets-v7',
      type: 'vector',
    },
  },
  sprite: 'mapbox://sprites/mapbox/basic-v8',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#F2F2F2',
      },
    },
    {
      id: 'landuse_overlay_national_park',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse_overlay',
      filter: ['==', 'class', 'national_park'],
      paint: {
        'fill-color': '#F2F2F2',
        'fill-opacity': 0.75,
      },
    },
    {
      id: 'landuse_park',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#F2F2F2',
      },
    },
    // {
    //   id: 'admin-1-boundaries',
    //   type: 'line',
    //   source: 'admin-1',
    //   'source-layer': 'boundaries_admin_1',
    //   filter: [
    //     'any',
    //     ['==', 'all', ['get', 'worldview']],
    //     ['in', 'US', ['get', 'worldview']],
    //   ],
    // },

    {
      id: 'waterway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'waterway',
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        ['in', 'class', 'river', 'canal'],
      ],
      paint: {
        'line-color': '#a0cfdf',
        'line-width': {
          base: 1.4,
          stops: [
            [8, 0.5],
            [20, 15],
          ],
        },
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#7ACff0',
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#F2F2F2',
      },
    },
    {
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway_link',
            'street',
            'street_limited',
            'service',
            'track',
            'pedestrian',
            'path',
            'link',
          ],
          ['==', 'structure', 'tunnel'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'tunnel_minor',
      paint: {
        'line-color': '#ffffff',
        'line-width': {
          base: 1.55,
          stops: [
            [4, 0.25],
            [20, 30],
          ],
        },
        'line-dasharray': [0.36, 0.18],
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway',
            'primary',
            'secondary',
            'tertiary',
            'trunk',
          ],
          ['==', 'structure', 'tunnel'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'tunnel_major',
      paint: {
        'line-color': '#E1E1E1',
        'line-width': {
          base: 1.4,
          stops: [
            [6, 0.5],
            [20, 30],
          ],
        },
        'line-dasharray': [0.28, 0.14],
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway_link',
            'street',
            'street_limited',
            'service',
            'track',
            'pedestrian',
            'path',
            'link',
          ],
          ['in', 'structure', 'none', 'ford'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'road_minor',
      paint: {
        'line-color': '#ffffff',
        'line-width': {
          base: 1.55,
          stops: [
            [4, 0.25],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway',
            'primary',
            'secondary',
            'tertiary',
            'trunk',
          ],
          ['in', 'structure', 'none', 'ford'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'road_major',
      paint: {
        'line-color': '#E1E1E1',
        'line-width': {
          base: 1.4,
          stops: [
            [6, 0.5],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway_link',
            'street',
            'street_limited',
            'service',
            'track',
            'pedestrian',
            'path',
            'link',
          ],
          ['==', 'structure', 'bridge'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'bridge_minor case',
      paint: {
        'line-color': '#ffffff',
        'line-width': {
          base: 1.6,
          stops: [
            [12, 0.5],
            [20, 10],
          ],
        },
        'line-gap-width': {
          base: 1.55,
          stops: [
            [4, 0.25],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway',
            'primary',
            'secondary',
            'tertiary',
            'trunk',
          ],
          ['==', 'structure', 'bridge'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'bridge_major case',
      paint: {
        'line-color': '#E1E1E1',
        'line-width': {
          base: 1.6,
          stops: [
            [12, 0.5],
            [20, 10],
          ],
        },
        'line-gap-width': {
          base: 1.55,
          stops: [
            [4, 0.25],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway_link',
            'street',
            'street_limited',
            'service',
            'track',
            'pedestrian',
            'path',
            'link',
          ],
          ['==', 'structure', 'bridge'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'bridge_minor',
      paint: {
        'line-color': '#ffffff',
        'line-width': {
          base: 1.55,
          stops: [
            [4, 0.25],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'all',
          [
            'in',
            'class',
            'motorway',
            'primary',
            'secondary',
            'tertiary',
            'trunk',
          ],
          ['==', 'structure', 'bridge'],
        ],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'bridge_major',
      paint: {
        'line-color': '#E1E1E1',
        'line-width': {
          base: 1.4,
          stops: [
            [6, 0.5],
            [20, 30],
          ],
        },
      },
      'source-layer': 'road',
    },
    {
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        ['all', ['<=', 'admin_level', 2], ['==', 'maritime', 0]],
      ],
      type: 'line',
      source: 'mapbox',
      id: 'admin_country',
      paint: {
        'line-color': '#8b8a8a',
        'line-width': {
          base: 1.3,
          stops: [
            [3, 0.5],
            [22, 15],
          ],
        },
      },
      'source-layer': 'admin',
    },
    {
      minzoom: 5,
      layout: {
        'icon-image': '{maki}-11',
        'text-offset': [0, 0.5],
        'text-field': '{name_en}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-max-width': 8,
        'text-anchor': 'top',
        'text-size': 11,
        'icon-size': 1,
      },
      filter: [
        'all',
        ['==', '$type', 'Point'],
        ['all', ['==', 'scalerank', 1], ['==', 'localrank', 1]],
      ],
      type: 'symbol',
      source: 'mapbox',
      id: 'poi_label',
      paint: {
        'text-color': '#666',
        'text-halo-width': 1,
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-blur': 1,
      },
      'source-layer': 'poi_label',
    },
    {
      layout: {
        'symbol-placement': 'line',
        'text-field': '{name_en}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
        'text-size': {
          base: 1.4,
          stops: [
            [10, 8],
            [20, 14],
          ],
        },
      },
      filter: [
        'all',
        ['==', '$type', 'LineString'],
        [
          'in',
          'class',
          'motorway',
          'primary',
          'secondary',
          'tertiary',
          'trunk',
        ],
      ],
      type: 'symbol',
      source: 'mapbox',
      id: 'road_major_label',
      paint: {
        'text-color': '#666',
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-width': 2,
      },
      'source-layer': 'road_label',
    },
    {
      minzoom: 8,
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-max-width': 6,
        'text-size': {
          stops: [
            [6, 12],
            [12, 16],
          ],
        },
      },
      filter: [
        'all',
        ['==', '$type', 'Point'],
        [
          'in',
          'type',
          'town',
          'village',
          'hamlet',
          'suburb',
          'neighbourhood',
          'island',
        ],
      ],
      type: 'symbol',
      source: 'mapbox',
      id: 'place_label_other',
      paint: {
        'text-color': '#666',
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-width': 1,
        'text-halo-blur': 1,
      },
      'source-layer': 'place_label',
    },
    {
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-max-width': 10,
        'text-size': {
          stops: [
            [3, 12],
            [8, 16],
          ],
        },
      },
      maxzoom: 16,
      filter: ['all', ['==', '$type', 'Point'], ['==', 'type', 'city']],
      type: 'symbol',
      source: 'mapbox',
      id: 'place_label_city',
      paint: {
        'text-color': '#666',
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-width': 1,
        'text-halo-blur': 1,
      },
      'source-layer': 'place_label',
    },
    {
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-max-width': 10,
        'text-size': {
          stops: [
            [3, 14],
            [8, 22],
          ],
        },
      },
      maxzoom: 12,
      filter: ['==', '$type', 'Point'],
      type: 'symbol',
      source: 'mapbox',
      id: 'country_label',
      paint: {
        'text-color': '#666',
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-width': 1,
        'text-halo-blur': 1,
      },
      'source-layer': 'country_label',
    },
  ],
} as const;
