<template>
	<form action="/api/users/create" method="post">
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
		<button type="submit" class="btn btn-primary mt-5">Send</button>
	</form>
</template>

<script setup lang="ts"></script>
