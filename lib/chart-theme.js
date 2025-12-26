export default {
  // Using the primary palette defined in the CSS
  color: [
    'var(--color-primary-500)',
    'var(--color-blue-500)',
    'var(--color-green-500)',
    'var(--color-yellow-500)',
    'var(--color-orange-500)',
    'var(--color-red-500)',
    'var(--color-purple-500)',
    'var(--color-cyan-500)',
    'var(--color-pink-500)',
    'var(--color-teal-500)'
  ],

  // Transparent by default so it layers over the panel backgrounds defined in CSS
  backgroundColor: 'transparent',


  textStyle: {
    fontFamily: 'var(--font-sans)',
  },

  grid: {
    left: 25,
    right: 25,
    top: 25,
    bottom: 30,
    containLabel: true
  },

  title: {
    textStyle: {
      color: 'var(--color-text-100)',
      fontFamily: 'var(--font-sans)',
      fontSize: 18, // Matches --toaster-title-font-size roughly
      fontWeight: 'bold',
    },
    subtextStyle: {
      color: 'var(--color-text-500)',
      fontFamily: 'var(--font-sans)',
    },
  },

  line: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 4,
    symbol: 'circle',
    smooth: true,
  },

  radar: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 4,
    symbol: 'circle',
    smooth: true,
    splitLine: {
      lineStyle: {
        color: ['var(--divider-color)']
      }
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: ['var(--color-blackwhite-0-05)', 'transparent']
      }
    },
    axisLine: {
      lineStyle: {
        color: 'var(--color-bg-400)'
      }
    }
  },

  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: 'var(--color-bg-400)',
    },
    emphasis: {
      itemStyle: {
        color: 'var(--color-primary-400)', // Hover highlight
      },
    },
  },

  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
    label: {
      color: 'var(--color-text-200)',
    },
  },

  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
  },

  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
  },

  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
  },

  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
  },

  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
  },

  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
    title: {
      color: 'var(--color-text-100)',
    },
    detail: {
      color: 'var(--color-primary-500)',
    },
    axisLine: {
      lineStyle: {
        color: [
          [0.2, 'var(--color-primary-300)'],
          [0.8, 'var(--color-primary-500)'],
          [1, 'var(--color-primary-700)']
        ],
        width: 8
      }
    }
  },

  candlestick: {
    itemStyle: {
      color: 'var(--color-red-500)', // Bearish
      color0: 'var(--color-green-500)', // Bullish (using standard green var)
      borderColor: 'var(--color-red-500)',
      borderColor0: 'var(--color-green-500)',
      borderWidth: 1,
    },
  },

  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: 'var(--color-bg-400)',
    },
    lineStyle: {
      width: 1,
      color: 'var(--color-bg-300)',
    },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true,
    color: [
      'var(--color-primary-500)',
      'var(--color-blue-500)',
      'var(--color-green-500)',
      'var(--color-red-500)',
    ],
    label: {
      color: 'var(--color-text-200)',
    },
  },

  map: {
    itemStyle: {
      areaColor: 'var(--color-bg-500)',
      borderColor: 'var(--color-bg-400)',
      borderWidth: 0.5,
    },
    label: {
      color: 'var(--color-text-100)',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'var(--color-primary-500)',
        borderColor: 'var(--color-bg-600)',
        borderWidth: 1,
      },
      label: {
        color: 'var(--color-primary-text-100)',
      },
    },
  },

  geo: {
    itemStyle: {
      areaColor: 'var(--color-bg-500)',
      borderColor: 'var(--color-bg-400)',
      borderWidth: 0.5,
    },
    label: {
      color: 'var(--color-text-200)',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'var(--color-primary-600)',
        borderColor: 'var(--color-bg-300)',
        borderWidth: 1,
      },
      label: {
        color: 'var(--color-primary-text-100)',
      },
    },
  },

  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisLabel: {
      show: true,
      color: 'var(--color-text-500)', // Subtle text
      fontFamily: 'var(--font-mono)',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['var(--divider-color)'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['var(--color-blackwhite-0-05)', 'transparent'],
      },
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisTick: {
      show: false,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisLabel: {
      show: true,
      color: 'var(--color-text-500)',
      fontFamily: 'var(--font-mono)',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['var(--thin-divider-color)'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['var(--color-blackwhite-0-05)', 'transparent'],
      },
    },
  },

  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisLabel: {
      show: true,
      color: 'var(--color-text-500)',
      fontFamily: 'var(--font-mono)',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['var(--thin-divider-color)'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['var(--color-blackwhite-0-05)', 'transparent'],
      },
    },
  },

  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: 'var(--color-bg-400)',
      },
    },
    axisLabel: {
      show: true,
      color: 'var(--color-text-500)',
      fontFamily: 'var(--font-mono)',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['var(--thin-divider-color)'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['var(--color-blackwhite-0-05)', 'transparent'],
      },
    },
  },

  toolbox: {
    iconStyle: {
      borderColor: 'var(--color-text-500)',
    },
    emphasis: {
      iconStyle: {
        borderColor: 'var(--color-primary-500)',
      },
    },
  },

  legend: {
    textStyle: {
      color: 'var(--color-text-300)',
      fontFamily: 'var(--font-sans)',
    },
    inactiveColor: 'var(--color-text-800)',
  },

  tooltip: {
    trigger: 'item',
    showContent: true,
    confine: true,
    backgroundColor: 'var(--tooltip-bg-color)', // Matches the thymer tooltip
    borderColor: 'var(--tooltip-border-color)',
    borderWidth: 1,
    textStyle: {
      color: 'var(--tooltip-fg-color)',
      fontFamily: 'var(--font-sans)',
      fontSize: 12, // Matches --text-size-xsmall roughly
    },
    extraCssText: 'box-shadow: var(--shadow-small); border-radius: var(--radius-normal);',
  },

  timeline: {
    lineStyle: {
      color: 'var(--color-bg-300)',
      width: 2,
    },
    itemStyle: {
      color: 'var(--color-bg-300)',
      borderWidth: 1,
    },
    controlStyle: {
      color: 'var(--color-text-500)',
      borderColor: 'var(--color-text-500)',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: 'var(--color-primary-500)',
      borderColor: 'var(--color-primary-200)',
    },
    label: {
      color: 'var(--color-text-500)',
      fontFamily: 'var(--font-mono)',
    },
    emphasis: {
      itemStyle: {
        color: 'var(--color-primary-500)',
      },
      controlStyle: {
        color: 'var(--color-primary-500)',
        borderColor: 'var(--color-primary-500)',
        borderWidth: 1,
      },
      label: {
        color: 'var(--color-primary-500)',
      },
    },
  },

  visualMap: {
    color: ['var(--color-red-500)', 'var(--color-orange-500)', 'var(--color-yellow-500)'],
    textStyle: {
      color: 'var(--color-text-500)',
    },
  },

  dataZoom: {
    textStyle: {
      color: 'var(--color-text-500)',
    },
    backgroundColor: 'var(--color-bg-800)',
    fillerColor: 'var(--color-bg-500-50)', // Semi-transparent selection
    borderColor: 'transparent',
    moveHandleStyle: {
      color: 'var(--color-primary-600)',
      borderColor: 'transparent',
    },
    moveHandleSize: 6,
    handleStyle: {
      color: 'var(--color-primary-600)',
      borderColor: 'var(--color-primary-700)',
    },
    dataBackground: {
      areaStyle: {
        color: 'var(--color-text-800)',
        opacity: 0.5,
      },
      lineStyle: {
        opacity: 0.5,
        color: 'var(--color-text-800)',
      },
    },
    selectedDataBackground: {
      areaStyle: {
        color: 'var(--color-primary-500)',
        opacity: 0.5,
      },
      lineStyle: {
        opacity: 0.5,
        color: 'var(--color-primary-500)',
      },
    },
  },

  markPoint: {
    label: {
      color: 'var(--color-text-100)',
    },
    emphasis: {
      label: {
        color: 'var(--color-text-50)',
      },
    },
  },

  matrix: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    x: {
      show: true,
      color: 'var(--color-text-500)',
    },
    y: {
      show: true,
      color: 'var(--color-text-500)',
    },
    corner: {
      itemStyle: {
        borderColor: 'transparent',
        borderWidth: 0,
      },
    },
    backgroundStyle: {
      borderColor: 'transparent',
    },
    borderZ2: 0,
  },
};