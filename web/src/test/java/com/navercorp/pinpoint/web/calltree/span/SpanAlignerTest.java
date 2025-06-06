/*
 * Copyright 2017 NAVER Corp.
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

package com.navercorp.pinpoint.web.calltree.span;

import com.navercorp.pinpoint.common.server.bo.SpanBo;
import com.navercorp.pinpoint.common.server.bo.SpanEventBo;
import com.navercorp.pinpoint.common.trace.ServiceType;
import com.navercorp.pinpoint.loader.service.ServiceTypeRegistryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.function.Predicate;

/**
 * @author jaehong.kim
 */
public class SpanAlignerTest {


    private ServiceTypeRegistryService serviceTypeRegistryService;

    @BeforeEach
    public void setUp() throws Exception {
        serviceTypeRegistryService = Mockito.mock(ServiceTypeRegistryService.class);
        Mockito.when(serviceTypeRegistryService.findServiceType(Mockito.anyInt())).thenReturn(ServiceType.UNKNOWN);
    }

    @Test
    public void singleSpan() {
        List<String> expectResult = List.of("#", "##", "###", "####");

        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, -1));

        List<SpanBo> list = List.of(span);
        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("single", callTree, expectResult);
    }

    @Test
    public void nextSpan() {
        List<String> expectResult = List.of(
                "#",
                "##",
                "###",
                "####",
                "#####", // nextSpan
                "######",
                "#######",
                "########");


        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, 100));

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(1);
        nextSpan.setSpanId(100);
        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(1, 2, -1));
        nextSpan.addSpanEvent(makeSpanEvent(2, 3, -1));

        List<SpanBo> list = List.of(span, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("link", callTree, expectResult);
    }

    @Test
    public void duplicatedNextSpan() {
        List<String> expectResult = List.of(
                "#",
                "##",
                "###",
                "####",
                "#####", // nextSpan
                "######",
                "#######",
                "########",
                "#########",
                "######",
                "#######",
                "########",
                "#########",
                "###",
                "####"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, 100));
        span.addSpanEvent(makeSpanEvent(3, 2, -1));
        // Duplicated next span
        span.addSpanEvent(makeSpanEvent(4, 3, 100));

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(1);
        nextSpan.setSpanId(100);
        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(1, 2, -1));
        nextSpan.addSpanEvent(makeSpanEvent(2, 3, -1));

        // Duplicated span - skip(in LinkMap)
        SpanBo nextSpan2 = new SpanBo();
        nextSpan2.setParentSpanId(1);
        nextSpan2.setSpanId(100);
        nextSpan2.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan2.addSpanEvent(makeSpanEvent(1, 2, -1));
        nextSpan2.addSpanEvent(makeSpanEvent(2, 3, -1));

        List<SpanBo> list = List.of(span, nextSpan, nextSpan2);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("duplicatedNextSpanId", callTree, expectResult);
    }

    @Test
    public void notFoundNextSpan() {
        List<String> expectResult = List.of(
                "#",
                "##",
                "###",
                "####"
        );


        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, 100));

        List<SpanBo> list = List.of(span);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("notFoundNextSpan", callTree, expectResult);
    }

    @Test
    public void notFoundRoot() {
        List<String> expectResult = List.of(
                "#", // unknown
                "##",
                "###",
                "####"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(1);
        span.setSpanId(2);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));

        List<SpanBo> list = List.of(span);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("notFoundRoot", callTree, expectResult);
    }

    @Test
    public void duplicatedRoot() {
        List<String> expectResult = List.of(
                "#", // unknown
                "##",
                "###"
        );

        SpanBo rootSpan1 = new SpanBo();
        rootSpan1.setParentSpanId(-1);
        rootSpan1.setSpanId(2);

        rootSpan1.addSpanEvent(makeSpanEvent(0, 1, -1));
        rootSpan1.addSpanEvent(makeSpanEvent(1, 2, -1));

        SpanBo rootSpan2 = new SpanBo();
        rootSpan2.setParentSpanId(-1);
        rootSpan2.setSpanId(3);

        rootSpan2.addSpanEvent(makeSpanEvent(0, 1, -1));
        rootSpan2.addSpanEvent(makeSpanEvent(1, 1, -1));

        List<SpanBo> list = List.of(rootSpan1, rootSpan2);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("duplicatedRoot", callTree, expectResult);
    }

    @Test
    public void fill() {
        List<String> expectResult = List.of(
                "#", // unknown - not found root
                "##",
                "###",
                "####",
                "#####", // unknown - fill link
                "######",
                "#######",
                "########"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(0);
        span.setSpanId(1);
        span.setElapsed(2);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, 100, 2));

        // missing middle span
        // parentSpanId = 1, spanId = 100

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(100);
        nextSpan.setSpanId(200);
        nextSpan.setElapsed(1);

        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(1, 2, -1));

        List<SpanBo> list = List.of(span, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("fill", callTree, expectResult);
    }

    @Test
    public void notFoundFill() {
        List<String> expectResult = List.of(
                "#", // unknown - not found root
                "##",
                "###",
                "####"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(0);
        span.setSpanId(1);
        span.setStartTime(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, 100, 2));

        // missing middle span
        // parentSpanId = 1, spanId = 100

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(100);
        nextSpan.setSpanId(200);
        nextSpan.setStartTime(0);  // too fast

        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(1, 2, -1));

        List<SpanBo> list = List.of(span, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("fill", callTree, expectResult);
    }

    @Test
    public void duplicatedSpan() {
        List<String> expectResult = List.of(
                "#", // unknown - not found root
                "##",
                "###",
                "####",
                "#####",
                "##",  // duplicatedSpan
                "###",
                "####",
                "#####",
                "######",  // nextSpan
                "#######",
                "#######",
                "########"
        );


        SpanBo span = new SpanBo();
        span.setParentSpanId(0);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, 100, 3));

        SpanBo duplicatedSpan = new SpanBo();
        duplicatedSpan.setParentSpanId(0);
        duplicatedSpan.setSpanId(1);
        duplicatedSpan.setElapsed(2);

        duplicatedSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        duplicatedSpan.addSpanEvent(makeSpanEvent(1, 2, -1));
        duplicatedSpan.addSpanEvent(makeSpanEvent(2, 3, 200));

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(1);
        nextSpan.setSpanId(200);
        nextSpan.setElapsed(1);

        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(1, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(2, 2, -1));

        List<SpanBo> list = List.of(span, duplicatedSpan, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("duplicatedSpan", callTree, expectResult);
    }

    @Test
    public void multipleSpanNotFoundRoot() {
        List<String> expectResult = List.of(
                "#", // unknown - not found root
                "##",
                "###",
                "####",
                "#####",
                "##",
                "###",
                "####",
                "#####"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(0);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, -1));
        span.addSpanEvent(makeSpanEvent(2, 3, 100, 3));

        SpanBo secondSpan = new SpanBo();
        secondSpan.setParentSpanId(0);
        secondSpan.setSpanId(100);

        secondSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        secondSpan.addSpanEvent(makeSpanEvent(1, 2, -1));
        secondSpan.addSpanEvent(makeSpanEvent(2, 3, -1));

        List<SpanBo> list = List.of(span, secondSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("multipleSpanNotFoundRoot", callTree, expectResult);
    }

    @Test
    public void corrupted() {
        List<String> expectResult = List.of(
                "#",
                "##",
                "###" // corrupted
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        // missing span event
        span.addSpanEvent(makeSpanEvent(2, 3, 100, 3));

        List<SpanBo> list = List.of(span);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("corrupted", callTree, expectResult);
    }

    @Test
    public void corruptedNextSpan() {
        List<String> expectResult = List.of(
                "#",
                "##",
                "###", // corrupted
                "####", // nextSpan
                "#####"
        );

        SpanBo span = new SpanBo();
        span.setParentSpanId(-1);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        // missing span event
        span.addSpanEvent(makeSpanEvent(2, 3, 100, 3));

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(1);
        nextSpan.setSpanId(100);

        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));

        List<SpanBo> list = List.of(span, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("corruptedNextSpan", callTree, expectResult);
    }

    @Test
    public void emptySpanList() {
        List<String> expectResult = List.of("#");

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);

        SpanAligner spanAligner = new SpanAligner(List.of(), filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("emptySpanList", callTree, expectResult);
    }

    @Test
    public void loopSpanList() {
        List<String> expectResult = List.of("#"); // unknown

        SpanBo span = new SpanBo();
        span.setParentSpanId(100);
        span.setSpanId(1);

        span.addSpanEvent(makeSpanEvent(0, 1, -1));
        span.addSpanEvent(makeSpanEvent(1, 2, 100));

        SpanBo nextSpan = new SpanBo();
        nextSpan.setParentSpanId(1);
        nextSpan.setSpanId(100);

        nextSpan.addSpanEvent(makeSpanEvent(0, 1, -1));
        nextSpan.addSpanEvent(makeSpanEvent(0, 2, 1));

        List<SpanBo> list = List.of(span, nextSpan);

        Predicate<SpanBo> filter = SpanFilters.collectorAcceptTimeFilter(1);
        SpanAligner spanAligner = new SpanAligner(list, filter, serviceTypeRegistryService);
        final CallTree callTree = spanAligner.align();
        CallTreeAssert.assertDepth("loopSpanList", callTree, expectResult);
    }

    private SpanEventBo makeSpanEvent(int sequence, int depth, int nextSpanId) {
        return makeSpanEvent(sequence, depth, nextSpanId, 0);
    }

    private SpanEventBo makeSpanEvent(int sequence, int depth, int nextSpanId, int endElapsed) {
        SpanEventBo event = new SpanEventBo();
        event.setSequence((short) sequence);
        event.setDepth(depth);
        event.setNextSpanId(nextSpanId);
        event.setEndElapsed(endElapsed);
        return event;
    }
}