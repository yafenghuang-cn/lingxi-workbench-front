import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

const regions = ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省"];
const regionValues = [3280, 2860, 2140, 1960, 2520, 2380];

const monthData = [920, 1010, 1150, 980, 1240, 1390, 1530, 1470, 1680, 1820, 1760, 1940];

const scatterPoints = [
  { name: "北京核心点", value: [116.4, 39.9, 340], region: "北京市" },
  { name: "天津港区", value: [117.2, 39.1, 260], region: "天津市" },
  { name: "石家庄枢纽", value: [114.5, 38.0, 220], region: "河北省" },
  { name: "太原中心", value: [112.55, 37.87, 190], region: "山西省" },
  { name: "呼和浩特节点", value: [111.73, 40.83, 240], region: "内蒙古自治区" },
  { name: "沈阳核心点", value: [123.43, 41.80, 300], region: "辽宁省" },
];

const regionMetrics = regions.map((region, index) => ({
  name: region,
  value: regionValues[index],
  growth: ["+18.6%", "+14.2%", "+9.4%", "+7.8%", "+12.1%", "+10.6%"][index],
}));

const mapSourceUrl = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

const ThreeDMapPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState("北京市");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      if (echarts.getMap("china-provinces")) {
        setMapReady(true);
        return;
      }

      const response = await fetch(mapSourceUrl);
      const geoJson = await response.json();
      if (cancelled) return;
      echarts.registerMap("china-provinces", geoJson as never);
      setMapReady(true);
    };

    loadMap().catch(() => {
      if (!cancelled) setMapReady(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIndex = Math.max(0, regions.indexOf(selectedRegion));
  const selectedValue = regionValues[selectedIndex];
  const selectedRatio = Math.round((selectedValue / Math.max(...regionValues)) * 100);

  const mapOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        borderWidth: 0,
        textStyle: { color: "#fff" },
      },
      visualMap: {
        min: 1800,
        max: 3400,
        show: false,
        inRange: {
          color: ["#dbeafe", "#93c5fd", "#60a5fa", "#38bdf8", "#0ea5e9"],
        },
      },
      geo: {
        map: "china-provinces",
        roam: false,
        layoutCenter: ["50%", "52%"],
        layoutSize: "100%",
        label: { show: true, color: "#0f172a", fontWeight: 700, fontSize: 11 },
        itemStyle: { borderColor: "#ffffff", borderWidth: 2, areaColor: "#e0f2fe" },
        emphasis: { label: { color: "#0f172a" }, itemStyle: { areaColor: "#7dd3fc" } },
        select: { label: { color: "#0f172a" }, itemStyle: { areaColor: "#38bdf8" } },
      },
      series: [
        {
          name: "区域地图",
          type: "map",
          map: "china-provinces",
          geoIndex: 0,
          selectedMode: "single",
          data: regions.map((name, index) => ({ name, value: regionValues[index], selected: name === selectedRegion })),
        },
        {
          name: "城市点位",
          type: "scatter",
          coordinateSystem: "geo",
          symbolSize: (val: number[]) => Math.max(12, val[2] / 20),
          itemStyle: {
            color: "#a855f7",
            shadowBlur: 14,
            shadowColor: "rgba(168, 85, 247, 0.35)",
          },
          data: scatterPoints.map((item) => ({ name: item.name, value: item.value, region: item.region })),
        },
      ],
    }),
    [selectedRegion],
  );

  const barOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      grid: { left: 24, right: 24, top: 70, bottom: 28, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#fff" },
      },
      xAxis: {
        type: "category",
        data: regions,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#64748b", fontSize: 12 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.18)", type: "dashed" } },
        axisLabel: { color: "#64748b" },
      },
      series: [
        {
          name: "访问量",
          type: "bar",
          data: regionValues.map((value, index) => ({
            value,
            itemStyle: {
              borderRadius: [10, 10, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: ["#60a5fa", "#34d399", "#fbbf24", "#fb7185", "#c084fc", "#38bdf8"][index] },
                { offset: 1, color: "rgba(99, 102, 241, 0.18)" },
              ]),
            },
          })),
          barWidth: 34,
          emphasis: { focus: "series" },
        },
      ],
    }),
    [],
  );

  const gaugeOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          startAngle: 220,
          endAngle: -40,
          radius: "92%",
          progress: {
            show: true,
            width: 18,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: "#60a5fa" },
                { offset: 0.5, color: "#34d399" },
                { offset: 1, color: "#fbbf24" },
              ]),
            },
          },
          axisLine: { lineStyle: { width: 18, color: [[1, "rgba(148, 163, 184, 0.18)"]] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: "#64748b" },
          pointer: { show: false },
          anchor: { show: true, showAbove: true, size: 12, itemStyle: { color: "#0f172a" } },
          detail: {
            valueAnimation: true,
            formatter: "{value}%",
            color: "#0f172a",
            fontSize: 28,
            fontWeight: 800,
            offsetCenter: [0, "35%"],
          },
          data: [{ value: selectedRatio }],
        },
      ],
    }),
    [selectedRatio],
  );

  const scatterOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      grid: { left: 28, right: 18, top: 24, bottom: 34, containLabel: true },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        formatter: (params: unknown) => {
          const p = params as { data: { name: string; value: number[]; region: string } };
          return `${p.data.region}<br/>${p.data.name}<br/>坐标 (${p.data.value[0]}, ${p.data.value[1]})<br/>热度：${p.data.value[2]}`;
        },
      },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.14)" } }, axisLabel: { color: "#64748b" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.14)" } }, axisLabel: { color: "#64748b" } },
      series: [
        {
          type: "scatter",
          symbolSize: (data: number[]) => Math.max(18, data[2] / 12),
          itemStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
              { offset: 0, color: "rgba(96, 165, 250, 0.95)" },
              { offset: 0.6, color: "rgba(167, 139, 250, 0.7)" },
              { offset: 1, color: "rgba(167, 139, 250, 0.15)" },
            ]),
          },
          data: scatterPoints.map((item) => ({ ...item })),
        },
      ],
    }),
    [],
  );

  const onBarEvents = {
    click: (params: { name: string }) => setSelectedRegion(params.name),
  };

  const onMapEvents = {
    click: (params: { name: string }) => setSelectedRegion(params.name),
  };

  const onScatterEvents = {
    click: (params: { data: { region?: string } }) => {
      if (params.data.region) setSelectedRegion(params.data.region);
    },
  };

  return (
    <div style={{ minHeight: "100vh", padding: 28, background: "radial-gradient(circle at top, #e0f2fe 0%, #f8fbff 38%, #f8fafc 72%, #eef2ff 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 12px", background: "rgba(15, 23, 42, 0.05)", color: "#334155", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "linear-gradient(135deg, #60a5fa, #a78bfa)" }} />
            ECharts Interactive Dashboard
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>三维地图分析页</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.8, color: "#475569" }}>
            这版加入了中国地图、仪表盘、散点图和区域联动。点击地图、柱状图或散点点位都可以切换当前区域。
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(128px, 1fr))", gap: 14, width: "min(100%, 480px)" }}>
          {regionMetrics.slice(0, 3).map((item) => (
            <div key={item.name} style={{ borderRadius: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.74) 100%)", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)", border: "1px solid rgba(255,255,255,0.7)", backdropFilter: "blur(18px)", padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{item.name}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{item.value}</div>
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>{item.growth}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginBottom: 18 }}>
        <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 100%)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)", border: "1px solid rgba(255,255,255,0.72)", backdropFilter: "blur(18px)" }}>
          <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>中国地图联动</div>
          {mapReady ? (
            <ReactECharts option={mapOption} style={{ height: 380, width: "100%" }} opts={{ renderer: "canvas" }} onEvents={onMapEvents} />
          ) : (
            <div style={{ height: 380, display: "grid", placeItems: "center", color: "#64748b" }}>地图加载中...</div>
          )}
        </div>

        <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 100%)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)", border: "1px solid rgba(255,255,255,0.72)", backdropFilter: "blur(18px)" }}>
          <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>区域健康度</div>
          <ReactECharts option={gaugeOption} style={{ height: 380, width: "100%" }} opts={{ renderer: "canvas" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 18 }}>
        <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 100%)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)", border: "1px solid rgba(255,255,255,0.72)", backdropFilter: "blur(18px)" }}>
          <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>区域访问量</div>
          <ReactECharts option={barOption} style={{ height: 360, width: "100%" }} opts={{ renderer: "canvas" }} onEvents={onBarEvents} />
        </div>

        <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 100%)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)", border: "1px solid rgba(255,255,255,0.72)", backdropFilter: "blur(18px)" }}>
          <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>城市散点分布</div>
          <ReactECharts option={scatterOption} style={{ height: 360, width: "100%" }} opts={{ renderer: "canvas" }} onEvents={onScatterEvents} />
        </div>
      </div>

      <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 100%)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)", border: "1px solid rgba(255,255,255,0.72)", backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>当前选中区域</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>{selectedRegion} · 访问量 {selectedValue}</div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>点击地图、柱状图、散点图都可联动</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>月度趋势</div>
            <ReactECharts
              option={{
                backgroundColor: "transparent",
                grid: { left: 24, right: 24, top: 42, bottom: 24, containLabel: true },
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  boundaryGap: false,
                  data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
                  axisLine: { lineStyle: { color: "#cbd5e1" } },
                  axisLabel: { color: "#64748b" },
                },
                yAxis: {
                  type: "value",
                  splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.18)", type: "dashed" } },
                  axisLabel: { color: "#64748b" },
                },
                series: [
                  {
                    name: selectedRegion,
                    type: "line",
                    smooth: true,
                    symbol: "circle",
                    symbolSize: 8,
                    lineStyle: { width: 4, color: ["#38bdf8", "#34d399", "#fb7185", "#a855f7", "#fbbf24", "#60a5fa"][selectedIndex] },
                    itemStyle: { color: ["#38bdf8", "#34d399", "#fb7185", "#a855f7", "#fbbf24", "#60a5fa"][selectedIndex] },
                    areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: "rgba(56, 189, 248, 0.35)" },
                        { offset: 1, color: "rgba(56, 189, 248, 0.03)" },
                      ]),
                    },
                    data: monthData.map((value, index) => Math.round(value * (0.75 + (selectedIndex + 1) * 0.06 + index * 0.008))),
                  },
                ],
              }}
              style={{ height: 320, width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>

          <div>
            <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>区域详情</div>
            <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.02) 100%)" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>覆盖率</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{selectedRatio}%</div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
                当前区域的地图、柱状图、散点图和仪表盘都已联动。点击任意区域后，趋势和指标会跟着变化，适合做驾驶舱里的重点区域分析。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDMapPage;
