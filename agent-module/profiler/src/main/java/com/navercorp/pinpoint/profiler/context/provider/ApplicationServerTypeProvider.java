/*
 * Copyright 2017 NAVER Corp.
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

package com.navercorp.pinpoint.profiler.context.provider;

import com.google.inject.Inject;
import com.google.inject.Provider;
import com.navercorp.pinpoint.common.trace.ServiceType;
import com.navercorp.pinpoint.profiler.context.module.ConfiguredApplicationType;
import com.navercorp.pinpoint.profiler.plugin.PluginContextLoadResult;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;

/**
 * @author Woonduk Kang(emeroad)
 */
public class ApplicationServerTypeProvider implements Provider<ServiceType> {

    private static final ServiceType DEFAULT_APPLICATION_TYPE = ServiceType.JAVA;

    private final Logger logger = LogManager.getLogger(this.getClass());

    private final ServiceType configuredApplicationType;
    private final Provider<PluginContextLoadResult> pluginContextLoadResultProvider;

    @Inject
    public ApplicationServerTypeProvider(@ConfiguredApplicationType
                                         ServiceType configuredApplicationType,
                                         Provider<PluginContextLoadResult> pluginContextLoadResultProvider) {
        this.configuredApplicationType = Objects.requireNonNull(configuredApplicationType, "configuredApplicationType");
        this.pluginContextLoadResultProvider = pluginContextLoadResultProvider;
    }

    @Override
    public ServiceType get() {
        if (configuredApplicationType != ServiceType.UNDEFINED) {
            logger.info("Configured ApplicationServerType={}", configuredApplicationType);
            return configuredApplicationType;
        }

        PluginContextLoadResult pluginContextLoadResult = this.pluginContextLoadResultProvider.get();
        ServiceType resolvedApplicationType = pluginContextLoadResult.getApplicationType();
        if (resolvedApplicationType == null) {
            logger.info("Application type not resolved. Defaulting to {}", DEFAULT_APPLICATION_TYPE);
            return DEFAULT_APPLICATION_TYPE;
        }
        logger.info("Resolved Application type : {}", resolvedApplicationType);
        return resolvedApplicationType;
    }

}
