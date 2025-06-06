/*
 * Copyright 2022 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.plugin.httpclient5;

import com.navercorp.pinpoint.bootstrap.logging.PluginLogManager;
import com.navercorp.pinpoint.bootstrap.logging.PluginLogger;
import com.navercorp.pinpoint.bootstrap.plugin.request.ClientHeaderAdaptor;
import org.apache.hc.core5.http.HttpRequest;

public class HttpRequest5ClientHeaderAdaptor implements ClientHeaderAdaptor<HttpRequest> {
    private final PluginLogger logger = PluginLogManager.getLogger(this.getClass());
    private final boolean isDebug = logger.isDebugEnabled();

    @Override
    public void setHeader(HttpRequest request, String name, String value) {
        try {
            if (request != null) {
                request.setHeader(name, value);
                if (isDebug) {
                    logger.debug("Set header {}={}", name, value);
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public boolean contains(HttpRequest header, String name) {
        try {
            if (header != null) {
                return header.containsHeader(name);
            }
        } catch (Exception ignored) {
        }
        return false;
    }
}
