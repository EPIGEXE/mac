import type { SystemNote } from "../../../../db/schema/note";
import { CATEGORY, TAG } from "../../../categories";
import OsiModelContent from './osi-model.md?raw';
import IpAddressContent from './ip-address.md?raw';
import TcpContent from './tcp.md?raw';
import UdpContent from './udp.md?raw';
import HttpContent from './http.md?raw';
import HttpsTlsContent from './https-tls.md?raw';
import DnsContent from './dns.md?raw';
import RealtimeContent from './realtime.md?raw';
import WebSecurityContent from './web-security.md?raw';

export const networkNotes: SystemNote[] = [

    {
        id: 'sys-cs-network-osi-model',
        version: 1,
        title: 'OSI 7 Layer',
        content: OsiModelContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-ip-address',
        version: 1,
        title: 'IP Address',
        content: IpAddressContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-tcp',
        version: 1,
        title: 'TCP',
        content: TcpContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-udp',
        version: 1,
        title: 'UDP',
        content: UdpContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-http',
        version: 1,
        title: 'HTTP',
        content: HttpContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-https-tls',
        version: 1,
        title: 'HTTPS and TLS',
        content: HttpsTlsContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 6,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-dns',
        version: 1,
        title: 'DNS',
        content: DnsContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 7,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-realtime',
        version: 1,
        title: 'Real-time Communication',
        content: RealtimeContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 8,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-network-web-seurity',
        version: 1,
        title: 'Web Security',
        content: WebSecurityContent,
        category: CATEGORY.Network,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 9,
        createdAt: Date.now(),
    }
]
