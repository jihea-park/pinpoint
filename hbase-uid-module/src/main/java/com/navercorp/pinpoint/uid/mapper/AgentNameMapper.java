package com.navercorp.pinpoint.uid.mapper;

import com.navercorp.pinpoint.common.hbase.HbaseColumnFamily;
import com.navercorp.pinpoint.common.hbase.HbaseTables;
import com.navercorp.pinpoint.common.hbase.RowMapper;
import com.navercorp.pinpoint.common.hbase.util.CellUtils;
import com.navercorp.pinpoint.common.server.uid.AgentIdentifier;
import com.navercorp.pinpoint.uid.utils.UidBytesParseUtils;
import org.apache.hadoop.hbase.Cell;
import org.apache.hadoop.hbase.client.Result;
import org.springframework.stereotype.Component;

@Component
public class AgentNameMapper implements RowMapper<AgentIdentifier> {

    private static final HbaseColumnFamily DESCRIPTOR = HbaseTables.AGENT_NAME;

    @Override
    public AgentIdentifier mapRow(Result result, int rowNum) throws Exception {
        if (result.isEmpty()) {
            return null;
        }

        byte[] rowKey = result.getRow();
        String agentId = UidBytesParseUtils.parseAgentId(rowKey);
        long agentStartTime = UidBytesParseUtils.parseAgentStartTime(rowKey);

        Cell cell = result.getColumnLatestCell(DESCRIPTOR.getName(), DESCRIPTOR.getName());
        String agentName = CellUtils.valueToString(cell);

        return new AgentIdentifier(agentId, agentName, agentStartTime);
    }
}
