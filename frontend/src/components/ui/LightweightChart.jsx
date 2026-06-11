import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, CandlestickSeries, AreaSeries } from 'lightweight-charts';

const LightweightChart = ({ data, type = 'candle', width = 0, height = 400, timeframe, symbol, refreshTrigger, isLoading }) => {
    const chartContainerRef = useRef();
    const chartRefDiv = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const [chartError, setChartError] = useState(null);

    // Refs for zoom reset logic
    const prevSymbol = useRef(null);
    const prevTimeframe = useRef(null);
    const prevRefreshTrigger = useRef(null);
    const [lastUpdatedTime, setLastUpdatedTime] = useState('');

    // Loading Stages list and state
    const STAGES = [
        "Fetching Market Data...",
        "Processing Candles...",
        "Running Technical Analysis...",
        "Updating Quant Engine...",
        "Rendering Chart..."
    ];
    const [loadingStage, setLoadingStage] = useState(STAGES[0]);
    const [renderOverlay, setRenderOverlay] = useState(isLoading);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setRenderOverlay(true);
            setIsFadingOut(false);
        } else {
            setIsFadingOut(true);
            const timer = setTimeout(() => {
                setRenderOverlay(false);
                setIsFadingOut(false);
            }, 220); // match fade out duration (220ms)
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Cycling loading stages logic
    useEffect(() => {
        if (!isLoading) {
            setLoadingStage(STAGES[0]);
            return;
        }

        let stageIndex = 0;
        const interval = setInterval(() => {
            if (stageIndex < STAGES.length - 1) {
                stageIndex++;
                setLoadingStage(STAGES[stageIndex]);
            }
        }, 150);

        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        if (!chartRefDiv.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        try {
            const chart = createChart(chartRefDiv.current, {
                width: chartContainerRef.current ? chartContainerRef.current.clientWidth : 600,
                height: height,
                layout: {
                    background: { type: 'solid', color: 'transparent' },
                    textColor: '#9CA3AF', // slate-400
                    fontFamily: 'Share Tech Mono, sans-serif',
                },
                grid: {
                    vertLines: { color: 'rgba(120, 120, 120, 0.12)', style: 1, visible: true },
                    horzLines: { color: 'rgba(120, 120, 120, 0.12)', style: 1, visible: true },
                },
                crosshair: {
                    mode: CrosshairMode.Normal,
                    vertLine: {
                        color: 'rgba(156, 163, 175, 0.4)',
                        width: 1,
                        style: 1,
                        labelBackgroundColor: '#1F2937', // gray-800
                    },
                    horzLine: {
                        color: 'rgba(156, 163, 175, 0.4)',
                        width: 1,
                        style: 1,
                        labelBackgroundColor: '#1F2937',
                    },
                },
                rightPriceScale: {
                    borderVisible: false,
                    visible: true,
                },
                timeScale: {
                    borderVisible: false,
                    timeVisible: true,
                    secondsVisible: false,
                    visible: true,
                    rightOffset: 18, // Visible breathing room before the price axis
                    fixLeftEdge: true,
                    fixRightEdge: false, // Set to false so rightOffset is respected
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true, // drag pan
                    horzTouchDrag: true,
                    vertTouchDrag: true
                },
                handleScale: {
                    mouseWheel: true,
                    pinch: true,
                    axisPressedMouseMove: {
                        time: true,
                        price: true
                    }
                }
            });
            chartRef.current = chart;

            // Add series based on type (v5 API compatibility)
            if (type === 'candle') {
                if (typeof chart.addCandlestickSeries === 'function') {
                    seriesRef.current = chart.addCandlestickSeries({
                        upColor: 'rgba(0, 255, 136, 0.8)',
                        downColor: 'rgba(255, 34, 68, 0.8)',
                        borderDownColor: 'rgba(255, 34, 68, 1)',
                        borderUpColor: 'rgba(0, 255, 136, 1)',
                        wickDownColor: 'rgba(255, 34, 68, 1)',
                        wickUpColor: 'rgba(0, 255, 136, 1)',
                    });
                } else {
                    seriesRef.current = chart.addSeries(CandlestickSeries, {
                        upColor: 'rgba(0, 255, 136, 0.8)',
                        downColor: 'rgba(255, 34, 68, 0.8)',
                        borderDownColor: 'rgba(255, 34, 68, 1)',
                        borderUpColor: 'rgba(0, 255, 136, 1)',
                        wickDownColor: 'rgba(255, 34, 68, 1)',
                        wickUpColor: 'rgba(0, 255, 136, 1)',
                    });
                }
            } else {
                if (typeof chart.addAreaSeries === 'function') {
                    seriesRef.current = chart.addAreaSeries({
                        lineColor: '#00ff88',
                        topColor: 'rgba(0, 255, 136, 0.22)',
                        bottomColor: 'rgba(0, 255, 136, 0)',
                        lineWidth: 2,
                    });
                } else {
                    seriesRef.current = chart.addSeries(AreaSeries, {
                        lineColor: '#00ff88',
                        topColor: 'rgba(0, 255, 136, 0.22)',
                        bottomColor: 'rgba(0, 255, 136, 0)',
                        lineWidth: 2,
                    });
                }
            }

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chart.remove();
            };
        } catch (e) {
            console.error("Failed to initialize lightweight chart:", e);
            setChartError(e.message || "Failed to load chart");
        }
    }, [type, height]); // Re-create chart if type changes

    useEffect(() => {
        if (!seriesRef.current || !data || data.length === 0) return;

        const selectedTimeframe = timeframe || 'Unknown';
        const candles = data;

        // Diagnostic log: output timeframe and loaded candles count
        console.log(
            'Timeframe:',
            selectedTimeframe,
            'Candles Loaded:',
            candles.length
        );

        // Transform data
        const formattedData = data.map(item => {
            let timeValue = item.time;
            if (timeValue === undefined || timeValue === null) {
                try {
                    const parsedTime = new Date(item.date).getTime() / 1000;
                    if (!isNaN(parsedTime)) {
                        timeValue = parsedTime;
                    } else {
                        timeValue = item.date;
                    }
                } catch (e) {
                    timeValue = item.date;
                }
            }

            if (type === 'candle') {
                return {
                    time: timeValue,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                };
            } else {
                return {
                    time: timeValue,
                    value: item.close,
                };
            }
        });
        
        // Sort and deduplicate data by time to prevent Lightweight Charts errors
        const uniqueData = Array.from(new Map(formattedData.map(item => [item.time, item])).values());
        uniqueData.sort((a, b) => a.time - b.time);

        try {
            seriesRef.current.setData(uniqueData);

            // Determine zoom reset conditions
            const hasSymbolChanged = prevSymbol.current !== symbol;
            const hasTimeframeChanged = prevTimeframe.current !== timeframe;
            const hasRefreshTriggered = refreshTrigger !== undefined && prevRefreshTrigger.current !== refreshTrigger;
            const isFirstLoad = prevSymbol.current === null && prevTimeframe.current === null;

            if (isFirstLoad || hasSymbolChanged || hasTimeframeChanged || hasRefreshTriggered) {
                console.log("[LightweightChart] Fitting content due to:", {
                    isFirstLoad,
                    hasSymbolChanged,
                    hasTimeframeChanged,
                    hasRefreshTriggered
                });
                chartRef.current.timeScale().fitContent();
            } else {
                console.log("[LightweightChart] Skipping fitContent to preserve user zoom.");
            }

            // Sync prev refs
            prevSymbol.current = symbol;
            prevTimeframe.current = timeframe;
            prevRefreshTrigger.current = refreshTrigger;

            // Sync last updated timestamp
            const now = new Date();
            setLastUpdatedTime(now.toLocaleTimeString());
        } catch(e) {
            console.error("Lightweight charts data error:", e);
        }

    }, [data, type, timeframe, symbol, refreshTrigger]);

    if (chartError) {
        return (
            <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 34, 68, 0.05)', border: '1px solid rgba(255, 34, 68, 0.3)', borderRadius: '4px' }}>
                <span style={{ color: '#ff2244', fontFamily: 'Share Tech Mono', fontSize: '0.8rem' }}>Chart Error: {chartError}</span>
            </div>
        );
    }

    return (
        <div ref={chartContainerRef} style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
            {/* Chart Area Sibling for Blurring/Dimming */}
            <div 
                ref={chartRefDiv} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    filter: (isLoading || isFadingOut) ? 'blur(1.5px) brightness(0.45)' : 'none',
                    transition: 'filter 0.22s ease',
                    pointerEvents: (isLoading || isFadingOut) ? 'none' : 'auto'
                }} 
            />

            {/* Premium Diagnostics Overlay */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 10,
                background: 'rgba(15, 23, 42, 0.82)', // Slate-900 with transparency
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(75, 85, 99, 0.25)',
                borderRadius: '4px',
                padding: '6px 10px',
                fontFamily: 'Share Tech Mono, JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#9CA3AF', // slate-400
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                pointerEvents: 'none', // Let user click/pan through the overlay
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>SYM:</span>
                    <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{symbol || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>TF:</span>
                    <span style={{ color: '#00eeff' }}>{timeframe || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>CANDLES:</span>
                    <span style={{ color: '#fff' }}>{data?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>UPDATED:</span>
                    <span style={{ color: '#ffaa00' }}>{lastUpdatedTime || 'N/A'}</span>
                </div>
            </div>

            {/* Bloomberg-inspired Loading Overlay */}
            {renderOverlay && (
                <div className={`chart-loading-overlay ${isFadingOut ? 'fade-out' : ''}`}>
                    <div className="chart-loading-spinner" />
                    <div className="chart-loading-title">⟳ Fetching Data</div>
                    <div className="chart-loading-tf">Loading {timeframe || 'Unknown'} chart...</div>
                    <div className="chart-loading-stage">{loadingStage}</div>
                </div>
            )}
        </div>
    );
};

export default LightweightChart;
