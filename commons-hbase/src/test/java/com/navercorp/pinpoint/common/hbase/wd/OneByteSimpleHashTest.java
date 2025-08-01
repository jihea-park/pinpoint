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

package com.navercorp.pinpoint.common.hbase.wd;

import com.navercorp.pinpoint.common.util.BytesUtils;
import org.apache.hadoop.hbase.util.Bytes;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OneByteSimpleHashTest {


    @Test
    void getHashPrefix_prefix1() {
        OneByteSimpleHash hash = new OneByteSimpleHash(16);

        int prefix = 1;
        int value = 1024 + 5;

        byte[] bytes = Bytes.toBytes(value);

        byte hashPrefix = hash.getHashPrefix(bytes);

        byte[] prefixBytes = BytesUtils.add((byte) 1, bytes);
        byte actualHashPrefix = hash.getHashPrefix(prefixBytes, prefix);

        assertEquals(hashPrefix, actualHashPrefix);
        assertEquals(value, BytesUtils.bytesToInt(prefixBytes, prefix));

    }

    @Test
    void getHashPrefix_all() {
        OneByteSimpleHash hash = new OneByteSimpleHash(16);

        SaltKeyPrefix allPrefixes = hash.getAllPrefixes(null);
        for (int i = 0; i < allPrefixes.size(); i++) {
            byte prefix = allPrefixes.getPrefix(i, null);

            Assertions.assertTrue(prefix >= 0 && prefix < 16);
        }
    }

}