<template>
	<div class="container w-50 p-5">
		<form action="/api/users/login" method="post">
			<div class="row">
				<div class="col">
					<div class="form-group">
						<label for="firstName">First name</label>
						<input type="text" class="form-control" id="fname" name="firstName" placeholder="Enter firstName">
					</div>
				</div>
				<div class="col">
					<div class="form-group">
						<label for="lastName">Last name</label>
						<input type="text" class="form-control" id="lname" name="lastName" placeholder="Enter lastName">
					</div>
				</div>
			</div>
			<button type="submit" class="btn btn-success mt-5">Send</button>
		</form>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
</script>