/*
 * Copyright 2018 NAVER Corp.
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

package com.navercorp.pinpoint.collector.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author Taejin Koo
 */
@RestController
public class ServerTimeController {

    @GetMapping(value = {"/api/serverTime", "/serverTime"})
    public ServerTime getServerTime() {
        return new ServerTime();
    }


    public static class ServerTime {

        public ServerTime() {
        }

        @JsonProperty("currentServerTime")
        public long getCurrentServerTime() {
            return System.currentTimeMillis();
        }
    }

}
