<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="text-column">
	<img src="/portrait.png" alt="Duncan Robertson" class="portrait" />

	<h1>About Me</h1>

	<p>
		I'm Duncan Robertson, a fifth-year aerospace engineering student and experienced tutor who is
		passionate about helping students reach their full potential in subjects that I personally love.
	</p>

	<p>
		My teaching philosophy is centered around empowering students to think for themselves and
		approach their studies with confidence. I believe that by guiding my students to find their own
		solutions, they'll take ownership of their learning and develop a stronger understanding of the
		material.
	</p>

	<p>
		I tutor mainly in maths (including VCE General up to Specialist), but can also provide physics,
		general science, and German lessons – all subjects that I have a personal passion for. I have
		extensive experience in these areas and can adapt to meet each student's individual needs,
		providing a personalized learning experience.
	</p>

	<p>
		What I enjoy most about tutoring is the satisfaction of watching my students improve and become
		more comfortable with their studies. After working with me, my goal for each student is to have
		the confidence and understanding to approach their studies with independence and to think for
		themselves.
	</p>

	<p>
		If you're looking for a tutor who is dedicated to your success and passionate about the subjects
		they teach, look no further. Let me help you reach your full potential!
	</p>
</div>

<style lang="scss">
	.portrait {
		border-radius: 50%;
		aspect-ratio: 1;
		width: min(40vw, 18em);
		object-fit: cover;
		object-position: top;
	}

	.text-column {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
