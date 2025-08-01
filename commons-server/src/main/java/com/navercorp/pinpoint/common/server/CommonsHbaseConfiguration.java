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

package com.navercorp.pinpoint.common.server;

import com.navercorp.pinpoint.common.hbase.wd.RowKeyDistributorByHashPrefix;
import com.navercorp.pinpoint.common.server.bo.serializer.RowKeyEncoder;
import com.navercorp.pinpoint.common.server.bo.serializer.agent.AgentIdRowKeyEncoder;
import com.navercorp.pinpoint.common.server.bo.serializer.agent.ApplicationNameRowKeyEncoder;
import com.navercorp.pinpoint.common.server.bo.serializer.metadata.MetaDataRowKey;
import com.navercorp.pinpoint.common.server.bo.serializer.metadata.MetadataEncoder;
import com.navercorp.pinpoint.common.server.bo.serializer.metadata.uid.UidMetaDataRowKey;
import com.navercorp.pinpoint.common.server.bo.serializer.metadata.uid.UidMetadataEncoder;
import com.navercorp.pinpoint.common.server.bo.serializer.trace.v2.config.SpanSerializeConfiguration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import({
        SpanSerializeConfiguration.class,
})
@ComponentScan(basePackages = {
        "com.navercorp.pinpoint.common.server.bo.codec",
        "com.navercorp.pinpoint.common.server.dao.hbase.mapper",
})
public class CommonsHbaseConfiguration {

    @Bean
    public AgentIdRowKeyEncoder agentIdRowKeyEncoder() {
        return new AgentIdRowKeyEncoder();
    }

    @Bean
    public ApplicationNameRowKeyEncoder applicationNameRowKeyEncoder() {
        return new ApplicationNameRowKeyEncoder();
    }

    @Bean
    public RowKeyEncoder<MetaDataRowKey> metaDataRowKeyEncoder(@Qualifier("metadataRowKeyDistributor")
                                                                   RowKeyDistributorByHashPrefix rowKeyDistributorByHashPrefix) {
        return new MetadataEncoder(rowKeyDistributorByHashPrefix);
    }

    @Bean
    public RowKeyEncoder<MetaDataRowKey> sqlDataRowKeyEncoder(@Qualifier("metadataRowKeyDistributor2")
                                                               RowKeyDistributorByHashPrefix rowKeyDistributorByHashPrefix) {
        return new MetadataEncoder(rowKeyDistributorByHashPrefix);
    }

    @Bean
    public RowKeyEncoder<UidMetaDataRowKey> uidMetadataEncoder(@Qualifier("metadataRowKeyDistributor2")
                                                     RowKeyDistributorByHashPrefix rowKeyDistributorByHashPrefix) {
        return new UidMetadataEncoder(rowKeyDistributorByHashPrefix);
    }
}
