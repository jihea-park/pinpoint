/*
 * Copyright 2024 NAVER Corp.
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
 *
 */

package com.navercorp.pinpoint.web.applicationmap.map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class MapViewsTest {
    @Test
    void extend_test() {
        Assertions.assertTrue(MapViews.ofSimpled().isSimplified());

        Assertions.assertFalse(MapViews.ofSimpled().isDetailed());
    }

    @Test
    void extend_test_complex() {
        MapViews mapViews = MapViews.ofSimpled().withDetailed();
        Assertions.assertTrue(mapViews.isSimplified());
        Assertions.assertFalse(mapViews.isBasic());
        Assertions.assertTrue(mapViews.isDetailed());
    }

}