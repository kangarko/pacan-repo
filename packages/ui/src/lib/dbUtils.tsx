import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AdminSalesData, EmailMessage, EmailThreadSummary, FacebookMessage, FacebookThreadSummary } from '@repo/ui/lib/types';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

const DB_NAME = 'AdminDashboardDB';
const DB_VERSION = 4;
const SALES_CACHE_STORE_NAME = 'salesDataCache';
const SUPPORT_EMAIL_CONVO_KEY = 'supportEmailConversations';
const SUPPORT_EMAIL_THREADS_KEY = 'supportEmailThreadsCache';
const SUPPORT_FB_CONVO_KEY = 'supportFbConversations';
const SUPPORT_FB_THREADS_KEY = 'supportFbThreadsCache';
const ALL_EMAIL_THREADS_KEY = 'allEmailThreads';
const ALL_FB_THREADS_KEY = 'allFbThreads';

interface AdminDB extends DBSchema {
    [SALES_CACHE_STORE_NAME]: {
        key: string; 
        value: AdminSalesData;
    };
    [SUPPORT_EMAIL_CONVO_KEY]: {
        key: string;
        value: EmailMessage[];
    };
    [SUPPORT_EMAIL_THREADS_KEY]: {
        key: string;
        value: EmailThreadSummary[];
    };
    [SUPPORT_FB_CONVO_KEY]: {
        key: string;
        value: FacebookMessage[];
    };
    [SUPPORT_FB_THREADS_KEY]: {
        key: string;
        value: FacebookThreadSummary[];
    };
}

let dbPromise: Promise<IDBPDatabase<AdminDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AdminDB>> {
    if (!dbPromise) {
        dbPromise = openDB<AdminDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(SALES_CACHE_STORE_NAME)) 
                    db.createObjectStore(SALES_CACHE_STORE_NAME);
                
                if (!db.objectStoreNames.contains(SUPPORT_EMAIL_CONVO_KEY)) 
                    db.createObjectStore(SUPPORT_EMAIL_CONVO_KEY);
                
                if (!db.objectStoreNames.contains(SUPPORT_EMAIL_THREADS_KEY)) 
                    db.createObjectStore(SUPPORT_EMAIL_THREADS_KEY);
                
                if (!db.objectStoreNames.contains(SUPPORT_FB_CONVO_KEY)) 
                    db.createObjectStore(SUPPORT_FB_CONVO_KEY);
                
                if (!db.objectStoreNames.contains(SUPPORT_FB_THREADS_KEY)) 
                    db.createObjectStore(SUPPORT_FB_THREADS_KEY);
            },
            blocked() {
                //alert(`IndexedDB ${DB_NAME} upgrade is blocked. Please close other tabs open to this site.`);
                //console.error(`IndexedDB ${DB_NAME} is blocked during upgrade.`);
            },
            blocking() {
                alert(`IndexedDB ${DB_NAME} upgrade is being blocked by another tab. Please close other tabs.`);
            },
            terminated() {
                alert(`IndexedDB ${DB_NAME} connection terminated unexpectedly. Please refresh.`);
                sendClientErrorEmail(`IndexedDB ${DB_NAME} connection terminated unexpectedly.`);
                
                dbPromise = null;
            },
        });
    }
    return dbPromise;
}

export async function getSalesDataCache(key: string): Promise<AdminSalesData | undefined> {
    try {
        const db = await getDB();
        return await db.get(SALES_CACHE_STORE_NAME, key);
    } catch (error: any) {
        sendClientErrorEmail(`Error getting sales data from IndexedDB (key: ${key})`, error);
        return undefined; 
    }
}

export async function setSalesDataCache(key: string, data: AdminSalesData): Promise<void> {
    try {
        const db = await getDB();
        await db.put(SALES_CACHE_STORE_NAME, data, key);
    } catch (error: any) {
        sendClientErrorEmail(`Error setting sales data in IndexedDB (key: ${key})`, error);
    }
}

export async function deleteSalesDataCache(key: string): Promise<void> {
    try {
        const db = await getDB();
        await db.delete(SALES_CACHE_STORE_NAME, key);
    } catch (error: any) {
        sendClientErrorEmail(`Error deleting sales data from IndexedDB (key: ${key})`, error);
    }
}

export async function getSupportEmailConversationCache(threadId: string): Promise<EmailMessage[] | undefined> {
    try {
        const db = await getDB();
        return await db.get(SUPPORT_EMAIL_CONVO_KEY, threadId);
    } catch (error: any) {
        sendClientErrorEmail(`Error getting email support conversation from IndexedDB (threadId: ${threadId})`, error);
        return undefined;
    }
}

export async function setSupportEmailConversationCache(threadId: string, conversation: EmailMessage[]): Promise<void> {
    try {
        const db = await getDB();
        await db.put(SUPPORT_EMAIL_CONVO_KEY, conversation, threadId);
    } catch (error: any) {
        sendClientErrorEmail(`Error setting email support conversation in IndexedDB (threadId: ${threadId})`, error);
    }
}

export async function deleteSupportEmailConversationCache(threadId: string): Promise<void> {
    try {
        const db = await getDB();
        await db.delete(SUPPORT_EMAIL_CONVO_KEY, threadId);
    } catch (error: any) {
        sendClientErrorEmail(`Error deleting email support conversation from IndexedDB (threadId: ${threadId})`, error);
    }
}

export async function getSupportEmailThreadsCache(): Promise<EmailThreadSummary[] | undefined> {
    try {
        const db = await getDB();
        return await db.get(SUPPORT_EMAIL_THREADS_KEY, ALL_EMAIL_THREADS_KEY);
    } catch (error: any) {
        sendClientErrorEmail('Error getting email support threads from IndexedDB', error);
        return undefined;
    }
}

export async function setSupportEmailThreadsCache(threads: EmailThreadSummary[]): Promise<void> {
    try {
        const db = await getDB();
        await db.put(SUPPORT_EMAIL_THREADS_KEY, threads, ALL_EMAIL_THREADS_KEY);
    } catch (error: any) {
        sendClientErrorEmail('Error setting email support threads in IndexedDB', error);
    }
}

export async function deleteSupportEmailThreadsCache(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear(SUPPORT_EMAIL_THREADS_KEY);

    } catch (error: any) {
        sendClientErrorEmail('Error deleting email support threads cache from IndexedDB', error);
    }
}

export async function getSupportFbConversationCache(conversationId: string): Promise<FacebookMessage[] | undefined> {
    try {
        const db = await getDB();
        return await db.get(SUPPORT_FB_CONVO_KEY, conversationId);
    } catch (error: any) {
        sendClientErrorEmail(`Error getting FB support conversation from IndexedDB (conversationId: ${conversationId})`, error);
        return undefined;
    }
}

export async function setSupportFbConversationCache(conversationId: string, conversation: FacebookMessage[]): Promise<void> {
    try {
        const db = await getDB();
        await db.put(SUPPORT_FB_CONVO_KEY, conversation, conversationId);
    } catch (error: any) {
        sendClientErrorEmail(`Error setting FB support conversation in IndexedDB (conversationId: ${conversationId})`, error);
    }
}

export async function deleteSupportFbConversationCache(conversationId: string): Promise<void> {
    try {
        const db = await getDB();
        await db.delete(SUPPORT_FB_CONVO_KEY, conversationId);
    } catch (error: any) {
        sendClientErrorEmail(`Error deleting FB support conversation from IndexedDB (conversationId: ${conversationId})`, error);
    }
}

export async function getSupportFbThreadsCache(): Promise<FacebookThreadSummary[] | undefined> {
    try {
        const db = await getDB();
        return await db.get(SUPPORT_FB_THREADS_KEY, ALL_FB_THREADS_KEY);
    } catch (error: any) {
        sendClientErrorEmail('Error getting FB support threads from IndexedDB', error);
        return undefined;
    }
}

export async function setSupportFbThreadsCache(threads: FacebookThreadSummary[]): Promise<void> {
    try {
        const db = await getDB();
        await db.put(SUPPORT_FB_THREADS_KEY, threads, ALL_FB_THREADS_KEY);
    } catch (error: any) {
        sendClientErrorEmail('Error setting FB support threads in IndexedDB', error);
    }
}

export async function deleteSupportFbThreadsCache(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear(SUPPORT_FB_THREADS_KEY);

    } catch (error: any) {
        sendClientErrorEmail('Error deleting FB support threads cache from IndexedDB', error);
    }
}

export async function clearSalesDataCache(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear(SALES_CACHE_STORE_NAME);
    } catch (error: any) {
        sendClientErrorEmail(`Error clearing sales data cache from IndexedDB`, error);
    }
} 