<template>
    <div v-if="mentee" class="lg:px-4 mx-auto w-full flex flex-col items-start lg:items-center">
        <InfoMentee v-if="mentee" :mentee="mentee" />
        <div class="flex flex-row items-center justify-start lg:justify-end w-full gap-4">
            <div class="flex flex-col items-end gap-4">
                <a v-if="mentee" :href="`/dashboard/mentees/${mentee.register_number}/meetings/new`"
                    class="bg-nitMaroon-600 text-white rounded-md p-2">
                    New Meeting</a>
            </div>
        </div>
        <h1 class="text-2xl font-bold self-start mt-12">Meetings</h1>
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch w-full gap-4 mt-5 pr-4 max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-6xl">
            <ul v-for="meeting in meetings" :key="`meeting_${meeting.id}`"
                class="text-start bg-zinc-100 rounded-md p-2 block w-full">
                <li class="font-bold">Meeting #{{ meeting.meeting_number }}</li>
                <li class="font-semibold text-xs">{{ new Date(meeting.date).toISOString().split("T")[0].split("-").reverse().join("/") }}</li>
                <li>{{ meeting.discussion.length > 40 ? meeting.discussion.slice(0, meeting.discussion.lastIndexOf(' ', 40)) + " ....." : meeting.discussion }}</li>
                <li>
                  <div class=" flex  ">
                         <button @click="_ => setMeeting(meeting.meeting_number)" class=" mx-auto flex flex-row items-center justify-start gap-2">
                        <span class="text-rose-700">Edit</span>
                        <svg class="block w-5 h-5 stroke-2 stroke-rose-700 mx-auto" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path class="transition-all duration-500 transform ease-in-out" stroke-linecap="round"
                                stroke-linejoin="round" :d="`${AllIcons.services}`" />
                        </svg>
                    </button>
                    
                    <button @click="_ => setView(meeting.meeting_number)" class=" mx-auto flex flex-row items-center justify-start gap-2"><span class="text-rose-700">View</span>
                        <svg class="block w-5 h-5 stroke-2 stroke-rose-700" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" aria-hidden="true">
                            <path class="transition-all duration-500 transform ease-in-out" stroke-linecap="round"
                                stroke-linejoin="round" :d="`${AllIcons.reports}`" />
                        </svg>
                    </button>
                </div>
                </li>
                  
                   
            </ul>
        </div>
        <div v-if="!meetings.length">No past meetings</div>
        <div
            :class="`${modelOpen ? `visible` : `invisible`} rounded-xl w-full md:max-w-2xl bg-white fixed z-50 p-4 flex flex-col items-center`">
            <div class="flex justify-between w-full">
                <div>Editing Details For Meeting #{{ currentMeeting }}</div>
                <button class="self-end" @click="_ => modelOpen = false">
                    X
                </button>
            </div>
            <form class="flex flex-col items-center gap-4 pt-8 w-full" @submit="e => handleSubmit(e)">
                <input type="date" name="date_field" :value="meetings.find(x => x.meeting_number === currentMeeting)?.date.toISOString().split(`T`)[0]" :max="new Date().toISOString().split(`T`)[0]"
                    class="p-2 rounded-md w-48 lg:w-72 shadow-md border border-gray-300" />
                <h2 class="text-xl font-bold">Discussion:</h2>
                <textarea name="discussion_field" class="p-2 rounded-md w-full max-w-lg shadow-md border border-gray-300" rows="5" :value="meetings.find(x => x.meeting_number === currentMeeting)?.discussion" />
                <MiscMessage
                    :class="`${message.text ? `opacity-100` : `opacity-0`} transition duration-500 ease-in-out w-full lg:w-96`"
                    :type="message.type">
                    {{ message.text }}</MiscMessage>
                <button type="submit"
                    class="rounded-md transition duration-500 ease-in-out transform hover:-translate-y-1 bg-nitMaroon-600 text-white py-2 px-8">
                    Update Meeting Info
                </button>
            </form>
        </div>

        
        <div
            :class="`${viewOpen ? `visible` : `invisible`} rounded-xl w-full md:max-w-2xl bg-white fixed z-50 p-4 flex flex-col items-center`">
            <div class="flex justify-between w-full">
                <div>Viewing Details For Meeting #{{ currentMeeting }}</div>
                <button class="self-end" @click="_ => viewOpen = false">
                    X
                </button>
            </div>
            <div class="flex flex-col items-center gap-4 pt-8 w-full">
                <h2 class="text-xl font-bold">Date:</h2>
                <div class="p-2 rounded-md w-48 lg:w-72 shadow-md bg-gray-50 text-center">
                    {{ meetings.find(x => x.meeting_number === currentMeeting)?.date.toISOString().split(`T`)[0] }}
                </div>
                <h2 class="text-xl font-bold">Discussion:</h2>
                <div class="p-4 rounded-md w-full max-w-lg overflow-auto shadow-md bg-gray-50 whitespace-pre-wrap">
                    {{ meetings.find(x => x.meeting_number === currentMeeting)?.discussion }}
                </div>
            </div>
        </div>
        <div :class="`${viewOpen ? `visible` : `invisible`} bg-black/40 backdrop-blur-md inset-0 w-full fixed z-40`" @click="viewOpen = false">
        </div>
        <div :class="`${modelOpen ? `visible` : `invisible`} bg-black/40 backdrop-blur-md inset-0 w-full fixed z-40`" @click="modelOpen = false">
        </div>
    </div>
</template>
<script setup lang="ts">
import type { Meeting } from "@/types/types.js"
definePageMeta({
    middleware: [
        "level1"
    ]
})

const route = useRoute();

const regno = route.params.regno as string;

const mentee = await useMentee(regno)

const meetings = ref<Meeting[]>([])

if (!mentee) {
    nextTick(() => {
        alert("No such student exists with Reg #" + regno)
        navigateTo("/dashboard")
    })
} else {
    meetings.value = (mentee.meetings || []).map(x => ({ ...x, date: new Date(x.date) }));
}

const message = ref({ type: "error", text: "" })
const modelOpen = ref(false);
const viewOpen = ref(false);
const currentMeeting = ref(-1)

const setMeeting = (meetingNumber: number) => {
    currentMeeting.value = meetingNumber;
    message.value.text = "";
    modelOpen.value = true;
}

const setView = (meetingNumber: number) => {
    currentMeeting.value = meetingNumber;
    viewOpen.value = true;
}

const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form as HTMLFormElement);
    const meetingNum = currentMeeting.value;
    const meetingRecord = meetings.value.find(x => x.meeting_number === meetingNum);

    if (!meetingRecord) {
        message.value.type = "error";
        message.value.text = "Meeting not found.";
        return;
    }

    const creds = {
        meetingId: meetingRecord.id,
        date: formData.get("date_field"),
        discussion: formData.get("discussion_field"),
    };

    try {
        await $fetch(`/api/meetings/details`, {
            method: "PATCH",
            body: creds,
        });

        message.value.type = "info";
        message.value.text = "Updated meeting info.";
        meetingRecord.date = new Date(String(creds.date));
        meetingRecord.discussion = String(creds.discussion);

        setTimeout(() => {
            modelOpen.value = false;
        }, 1000);
    } catch (err: any) {
        message.value.type = "error";
        message.value.text = err?.data?.statusText || err?.data?.statusMessage || "Failed to update meeting.";
    }
}
</script>
