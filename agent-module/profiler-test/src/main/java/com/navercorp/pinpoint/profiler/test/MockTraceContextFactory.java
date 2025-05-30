/*
 * Copyright 2023 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.profiler.test;

import com.google.inject.AbstractModule;
import com.google.inject.Module;
import com.navercorp.pinpoint.bootstrap.config.ProfilerConfig;
import com.navercorp.pinpoint.bootstrap.interceptor.registry.InterceptorRegistryAdaptor;
import com.navercorp.pinpoint.common.profiler.message.DataSender;
import com.navercorp.pinpoint.common.profiler.message.LoggingDataSender;
import com.navercorp.pinpoint.profiler.AgentInformation;
import com.navercorp.pinpoint.profiler.context.module.DefaultApplicationContext;
import com.navercorp.pinpoint.profiler.context.module.ModuleFactory;
import com.navercorp.pinpoint.profiler.context.storage.LogStorageFactory;
import com.navercorp.pinpoint.profiler.context.storage.StorageFactory;
import com.navercorp.pinpoint.profiler.interceptor.registry.InterceptorRegistryBinder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;


/**
 * @author emeroad
 */
public class MockTraceContextFactory {


    public static DefaultApplicationContext newMockApplicationContext(ProfilerConfig profilerConfig) {

        Module loggingModule = new LoggingModule();

        InterceptorRegistryBinder interceptorRegistryBinder = new EmptyInterceptorRegistryBinder();
        Module interceptorRegistryModule = InterceptorRegistryModule.wrap(interceptorRegistryBinder);
        ModuleFactory moduleFactory = new OverrideModuleFactory(loggingModule, interceptorRegistryModule);

        MockApplicationContextFactory factory = new MockApplicationContextFactory();
        return factory.build(profilerConfig.getProperties(), moduleFactory);
    }

    public static class LoggingModule extends AbstractModule {
        private final Logger logger = LogManager.getLogger(this.getClass());
        @Override
        protected void configure() {
            logger.info("configure {}", this.getClass().getSimpleName());

            bind(AgentInformation.class).toInstance(new TestAgentInformation());
            bind(StorageFactory.class).toInstance(new LogStorageFactory());
            bind(DataSender.class).toInstance(new LoggingDataSender<>());
        }
    }


    public static class EmptyInterceptorRegistryBinder implements InterceptorRegistryBinder {
        @Override
        public void bind() {

        }

        @Override
        public void unbind() {

        }

        @Override
        public InterceptorRegistryAdaptor getInterceptorRegistryAdaptor() {
            return null;
        }

        @Override
        public String getInterceptorRegistryClassName() {
            return null;
        }
    }
}
