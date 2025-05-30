/*
 * Copyright 2024 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.metric.common.util;

import com.navercorp.pinpoint.common.timeseries.point.DataPoint;
import com.navercorp.pinpoint.common.timeseries.point.Point;
import com.navercorp.pinpoint.common.timeseries.window.TimeWindow;
import com.navercorp.pinpoint.common.timeseries.window.TimeWindows;
import com.navercorp.pinpoint.metric.common.model.chart.AvgMinMaxMetricPoint;
import com.navercorp.pinpoint.metric.common.model.chart.AvgMinMetricPoint;
import com.navercorp.pinpoint.metric.common.model.chart.MinMaxMetricPoint;

import java.util.List;
import java.util.Objects;
import java.util.function.LongFunction;

/**
 * @author minwoo-jung
 */
public class TimeSeriesBuilder {

    private final TimeWindow timeWindow;

    public TimeSeriesBuilder(TimeWindow timeWindow) {
        this.timeWindow = Objects.requireNonNull(timeWindow, "timeWindow");
    }

    // TODO: (minwoo) Remove method duplication
    public List<MinMaxMetricPoint> buildForMinMaxMetricPointList(LongFunction<MinMaxMetricPoint> creator, List<MinMaxMetricPoint> minMaxMetricDataList) {
        return buildPointList(creator, minMaxMetricDataList);
    }

    public List<AvgMinMetricPoint> buildForAvgMinMetricPointList(LongFunction<AvgMinMetricPoint> creator, List<AvgMinMetricPoint> avgMinMetricDataList) {
        return buildPointList(creator, avgMinMetricDataList);
    }

    public List<AvgMinMaxMetricPoint> buildForAvgMinMaxMetricPointList(LongFunction<AvgMinMaxMetricPoint> creator, List<AvgMinMaxMetricPoint> avgMinMaxMetricDataList) {
        return buildPointList(creator, avgMinMaxMetricDataList);
    }

    public List<DataPoint<Double>> buildDoubleMetric(LongFunction<DataPoint<Double>> creator, List<DataPoint<Double>> systemMetricDataList) {
        return buildPointList(creator, systemMetricDataList);
    }

    public List<DataPoint<Long>> buildLongMetric(LongFunction<DataPoint<Long>> creator, List<DataPoint<Long>> systemMetricDataList) {
        return buildPointList(creator, systemMetricDataList);
    }

    private <T extends Point> List<T> buildPointList(LongFunction<T> function, List<T> dataList) {
        final List<T> pointList = TimeWindows.createInitialPoints(timeWindow, function);

        final int windowRangeCount = timeWindow.getWindowRangeCount();
        for (T point : dataList) {
            final int timeslotIndex = this.timeWindow.getWindowIndex(point.getTimestamp());
            if (timeslotIndex < 0 || timeslotIndex >= windowRangeCount) {
                continue;
            }
            pointList.set(timeslotIndex, point);
        }
        return pointList;
    }

}
