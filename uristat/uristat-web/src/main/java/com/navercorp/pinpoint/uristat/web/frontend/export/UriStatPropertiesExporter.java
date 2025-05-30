/*
 * Copyright 2025 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.uristat.web.frontend.export;

import com.navercorp.pinpoint.common.server.frontend.export.FrontendConfigExporter;
import com.navercorp.pinpoint.uristat.web.config.UriStatProperties;

import java.util.Map;
import java.util.Objects;

/**
 * @author minwoo-jung
 */
public class UriStatPropertiesExporter implements FrontendConfigExporter {

    private final UriStatProperties uriStatProperties;

    public UriStatPropertiesExporter(UriStatProperties uriStatProperties) {
        this.uriStatProperties = Objects.requireNonNull(uriStatProperties, "uriStatProperties");;
    }

    @Override
    public void export(Map<String, Object> export) {
        export.put("periodMax.uriStat", uriStatProperties.getUriStatPeriodMax());
        export.put("periodInterval.uriStat", uriStatProperties.getUriStatPeriodInteval());
    }
}
