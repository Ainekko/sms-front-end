<script lang="ts">
  import { brandName } from '../stores/messages';
</script>

<div
  class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10"
>
  <div class="flex items-center space-x-3">
    <div
      class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold"
    >
      {$brandName.charAt(0)}
    </div>
    <h1 class="text-lg font-bold text-gray-800">{$brandName}</h1>
  </div>
  <div class="flex items-center space-x-2">
    <span class="relative flex h-3 w-3">
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
      ></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </span>
    <span class="text-sm font-medium text-gray-600">Online</span>
  </div>
</div>
