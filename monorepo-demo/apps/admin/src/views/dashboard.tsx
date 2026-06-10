import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import * as echarts from 'echarts'
import Map from 'ol/Map'
import Overlay from 'ol/Overlay'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import { fromLonLat } from 'ol/proj'
import XYZ from 'ol/source/XYZ'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { fetchTodos } from '../api/client'
import { useDashboardStore } from '../stores/dashboard'

const reportSchema = z.object({
  owner: z.string().min(2, 'Owner requires at least 2 characters'),
  region: z.string().min(1, 'Select a region'),
  note: z.string().min(6, 'Note requires at least 6 characters'),
})

type ReportForm = z.infer<typeof reportSchema>

const regionOptions = [
  { value: 'Yangling', label: 'Yangling', coordinates: [108.0844, 34.2722] },
  { value: 'Hangzhou', label: 'Hangzhou', coordinates: [120.1551, 30.2741] },
  { value: 'Shanghai', label: 'Shanghai', coordinates: [121.4737, 31.2304] },
  { value: 'Shenzhen', label: 'Shenzhen', coordinates: [114.0579, 22.5431] },
] as const

const getRegionCenter = (region: string) => {
  const match = regionOptions.find((item) => item.value === region) ?? regionOptions[0]

  return fromLonLat([...match.coordinates])
}

const chartOption = {
  tooltip: { trigger: 'axis' },
  grid: { top: 24, right: 12, bottom: 24, left: 36 },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      name: 'Requests',
      data: [42, 58, 63, 71, 86],
      itemStyle: { color: '#1677ff' },
    },
  ],
}

const ChartPanel = () => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    const chart = echarts.init(chartRef.current)
    chart.setOption(chartOption)

    const resize = () => chart.resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} className="chart-surface" />
}

type MapPanelProps = {
  region: string
}

const MapPanel = ({ region }: MapPanelProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const markerOverlayRef = useRef<Overlay | null>(null)
  const initialRegionRef = useRef(region)

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    const marker = document.createElement('div')
    marker.className = 'map-marker'
    marker.title = initialRegionRef.current

    const center = getRegionCenter(initialRegionRef.current)
    const markerOverlay = new Overlay({
      element: marker,
      position: center,
      positioning: 'center-center',
    })

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            attributions:
              'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            maxZoom: 19,
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          }),
        }),
      ],
      overlays: [markerOverlay],
      view: new View({
        center,
        zoom: 15,
      }),
    })

    mapInstanceRef.current = map
    markerOverlayRef.current = markerOverlay

    const resize = () => map.updateSize()
    window.addEventListener('resize', resize)
    window.setTimeout(resize, 0)

    return () => {
      window.removeEventListener('resize', resize)
      map.setTarget(undefined)
      mapInstanceRef.current = null
      markerOverlayRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    const markerOverlay = markerOverlayRef.current

    if (!map || !markerOverlay) {
      return
    }

    const center = getRegionCenter(region)
    markerOverlay.setPosition(center)
    markerOverlay.getElement()?.setAttribute('title', region)
    map.getView().animate({ center, duration: 350, zoom: 15 })
  }, [region])

  return <div ref={mapRef} className="map-surface" />
}

export const DashboardPage = () => {
  const queryClient = useQueryClient()
  const selectedRegion = useDashboardStore((state) => state.selectedRegion)
  const setSelectedRegion = useDashboardStore((state) => state.setSelectedRegion)
  const refreshCount = useDashboardStore((state) => state.refreshCount)
  const bumpRefresh = useDashboardStore((state) => state.bumpRefresh)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      owner: 'Admin',
      region: selectedRegion,
      note: 'Daily operation check',
    },
  })

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-todos'],
    queryFn: fetchTodos,
  })

  const onSubmit = (values: ReportForm) => {
    setSelectedRegion(values.region)
    bumpRefresh()
  }

  const refreshTodos = async () => {
    bumpRefresh()
    await queryClient.invalidateQueries({ queryKey: ['admin-todos'] })
    await refetch()
  }

  return (
    <Space direction="vertical" size={16} className="dashboard-stack">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Current Region" value={selectedRegion} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Axios Items" value={data.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Zustand Refreshes" value={refreshCount} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="React Hook Form + Zod">
            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <Controller
                control={control}
                name="owner"
                render={({ field }) => (
                  <Form.Item
                    label="Owner"
                    validateStatus={errors.owner ? 'error' : undefined}
                    help={errors.owner?.message}
                  >
                    <Input {...field} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="region"
                render={({ field }) => (
                  <Form.Item
                    label="Region"
                    validateStatus={errors.region ? 'error' : undefined}
                    help={errors.region?.message}
                  >
                    <Select
                      {...field}
                      options={regionOptions.map(({ value, label }) => ({ value, label }))}
                    />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="note"
                render={({ field }) => (
                  <Form.Item
                    label="Note"
                    validateStatus={errors.note ? 'error' : undefined}
                    help={errors.note?.message}
                  >
                    <Input.TextArea {...field} rows={3} />
                  </Form.Item>
                )}
              />
              <Button type="primary" htmlType="submit">
                Save Report
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="TanStack Query + Axios"
            extra={
              <Button size="small" onClick={refreshTodos}>
                Refresh
              </Button>
            }
          >
            {isError ? (
              <Typography.Text type="danger">Unable to load remote example data.</Typography.Text>
            ) : (
              <List
                loading={isLoading}
                dataSource={data}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={`Task #${item.id}`} />
                    <Tag color={item.completed ? 'green' : 'blue'}>
                      {item.completed ? 'Done' : 'Open'}
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="ECharts">
            <ChartPanel />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={`OpenLayers Satellite - ${selectedRegion}`}>
            <MapPanel region={selectedRegion} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
