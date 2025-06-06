package com.navercorp.pinpoint.web.service;

import com.navercorp.pinpoint.common.timeseries.time.Range;
import com.navercorp.pinpoint.web.scatter.DragAreaQuery;
import com.navercorp.pinpoint.web.scatter.heatmap.HeatMap;
import com.navercorp.pinpoint.web.vo.LimitedScanResult;
import com.navercorp.pinpoint.web.vo.scatter.DotMetaData;

import java.util.List;

public interface HeatMapService {

    LimitedScanResult<List<DotMetaData>> dragScatterDataV2(String applicationName, DragAreaQuery dragAreaquery, int limit);

    LimitedScanResult<HeatMap> getHeatMap(String applicationName, Range range, long maxY, int limit);
}
