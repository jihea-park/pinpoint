/*
 * Copyright 2018 NAVER Corp.
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

package com.navercorp.pinpoint.it.plugin.jdbc.postgresql;

import com.navercorp.pinpoint.bootstrap.context.DatabaseInfo;
import com.navercorp.pinpoint.bootstrap.plugin.jdbc.JdbcUrlParserV2;
import com.navercorp.pinpoint.bootstrap.plugin.test.Expectations;
import com.navercorp.pinpoint.bootstrap.plugin.test.PluginTestVerifier;
import com.navercorp.pinpoint.bootstrap.plugin.test.PluginTestVerifierHolder;
import com.navercorp.pinpoint.it.plugin.utils.jdbc.DriverProperties;
import com.navercorp.pinpoint.it.plugin.utils.jdbc.JDBCApi;
import com.navercorp.pinpoint.plugin.jdbc.postgresql.PostgreSqlJdbcUrlParser;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Objects;

import static com.navercorp.pinpoint.bootstrap.plugin.test.Expectations.args;
import static com.navercorp.pinpoint.bootstrap.plugin.test.Expectations.cachedArgs;
import static com.navercorp.pinpoint.bootstrap.plugin.test.Expectations.event;
import static com.navercorp.pinpoint.bootstrap.plugin.test.Expectations.sql;
import static com.navercorp.pinpoint.it.plugin.utils.jdbc.JdbcUtils.doInTransaction;


/**
 * @author HyunGil Jeong
 */
public class PostgreSqlItHelper {

    private final Logger logger = LogManager.getLogger(this.getClass());

    private static final String POSTGRESQL = "POSTGRESQL";
    private static final String POSTGRESQL_EXECUTE_QUERY = "POSTGRESQL_EXECUTE_QUERY";

    private final String jdbcUrl;
    private final String databaseUser;
    private final String databasePassword;
    private final String databaseAddress;
    private final String databaseName;

    PostgreSqlItHelper(DriverProperties driverProperties) {
        Objects.requireNonNull(driverProperties, "driverProperties");

        jdbcUrl = driverProperties.getUrl();
        JdbcUrlParserV2 jdbcUrlParser = new PostgreSqlJdbcUrlParser();
        DatabaseInfo databaseInfo = jdbcUrlParser.parse(jdbcUrl);

        databaseAddress = databaseInfo.getHost().get(0);
        databaseName = databaseInfo.getDatabaseId();

        databaseUser = driverProperties.getUser();
        databasePassword = driverProperties.getPassword();
    }

    void testStatements(PostgreSqlJDBCApi jdbcMethod) throws Exception {
        final String name = "testUser";
        final int age = 5;

        String insertQuery = "INSERT INTO test (name, age) VALUES (?, ?)";
        String selectQuery = "SELECT * FROM test";
        String deleteQuery = "DELETE FROM test";


        try (Connection conn = DriverManager.getConnection(jdbcUrl, databaseUser, databasePassword)) {
            doInTransaction(conn, () -> {
                try (PreparedStatement insertPreparedStatement = conn.prepareStatement(insertQuery)) {
                    insertPreparedStatement.setString(1, name);
                    insertPreparedStatement.setInt(2, age);
                    insertPreparedStatement.execute();
                    try (Statement selectStatement = conn.createStatement()) {
                        try (ResultSet rs = selectStatement.executeQuery(selectQuery)) {
                            while (rs.next()) {
                                final String nameRs = rs.getString("name");
                                final int ageRs = rs.getInt("age");
                                logger.debug("name : {}, age: {}", nameRs, ageRs);
                            }
                        }
                    }
                }


                try (Statement deleteStatement = conn.createStatement()) {
                    deleteStatement.executeUpdate(deleteQuery, Statement.NO_GENERATED_KEYS);
                }
            });

            PluginTestVerifier verifier = PluginTestVerifierHolder.getInstance();

            verifier.printCache();

            // Driver#connect(String, Properties)
            Method connect = jdbcMethod.getDriver().getConnect();
            verifier.verifyTrace(event(POSTGRESQL, connect, null, databaseAddress, databaseName, cachedArgs(jdbcUrl)));

            // Connection#setAutoCommit(boolean)
            final JDBCApi.ConnectionClass connectionClazz = jdbcMethod.getConnection();
            Method setAutoCommit = connectionClazz.getSetAutoCommit();
            verifier.verifyTrace(event(POSTGRESQL, setAutoCommit, null, databaseAddress, databaseName, args(false)));

            // Connection#prepareStatement(String) - prepare insert
            Method prepareStatement = connectionClazz.getPrepareStatement();
            verifier.verifyTrace(event(POSTGRESQL, prepareStatement, null, databaseAddress, databaseName, sql(insertQuery, null)));

            // PreparedStatement#execute() - execute insert
            final JDBCApi.PreparedStatementClass prepareStatementClazz = jdbcMethod.getPreparedStatement();
            Method execute = prepareStatementClazz.getExecute();
            verifier.verifyTrace(event(POSTGRESQL_EXECUTE_QUERY, execute, null, databaseAddress, databaseName, Expectations.sql(insertQuery, null, name + ", " + age)));

            // Statement#executeQuery(String) - execute select
            final PostgreSqlJDBCApi.PostgreSqlStatementClass selectStatementClazz = jdbcMethod.getStatement();
            Method executeQuery = selectStatementClazz.getExecuteQuery();
            verifier.verifyTrace(event(POSTGRESQL_EXECUTE_QUERY, executeQuery, null, databaseAddress, databaseName, Expectations.sql(selectQuery, null)));

            // Statement#executeUpdate(String, int) - execute delete
            Method executeUpdate = selectStatementClazz.getStatementForExecuteUpdate();
            verifier.verifyTrace(event(POSTGRESQL_EXECUTE_QUERY, executeUpdate, null, databaseAddress, databaseName, Expectations.sql(deleteQuery, null)));

            // Connection#commit()
            Method commit = connectionClazz.getCommit();
            verifier.verifyTrace(event(POSTGRESQL, commit, null, databaseAddress, databaseName));
        }
    }
}
