/*
		 * Copyright (c) 2024 DiscountPLR.com
		 * 
		 * This code is licensed under the GNU General Public License v3.0.
		 * See the LICENSE file in the project root for license information at https://github.com/codinginbarn/Spin-Wheel-for-Discount.
		 */
		const wheel = document.querySelector('.wheel-image');
		const spinButton = document.querySelector('.spin-button');
		const rewardButton = document.querySelector('.reward-button');
		const rewardText = document.querySelector('.reward-text');

		let currentReward = null;

		const rewards = [
			{ label: '40% discount', message: 'This is the message that appears for <b>40% discount</b>', weight: 10 },
			{ label: '30% discount', message: 'This is the message that appears for <b>30% discount</b>', weight: 20 },
			{ label: '20% discount', message: 'This is the message that appears for <b>20% discount</b>', weight: 20 },
			{ label: '10% discount', message: 'This is the message that appears for <b>10% discount</b>', weight: 50 },
			{ label: '0% discount', message: 'This is the message that appears for <b>0% discount</b>', weight: 20 },
			{ label: '50% discount', message: 'This is the message that appears for <b>50% discount</b>', weight: 1 },
		];

		const weights = rewards.map(reward => reward.weight);
		const totalWeight = weights.reduce((total, weight) => total + weight, 0);

		function spinWheel() {
			const random = Math.floor(Math.random() * totalWeight);
			let cumulativeWeight = 0;
			for (let i = 0; i < rewards.length; i++) {
				cumulativeWeight += weights[i];
				if (random < cumulativeWeight) {
					currentReward = rewards[i];
					break;
				}
			}
			const rotation = 360 / rewards.length * rewards.indexOf(currentReward);
			const spinDuration = 8;
			wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.33, 0.08, 0.38, 1.23)`;
			wheel.style.transform = `rotate(${360 * spinDuration + rotation}deg)`;
			setTimeout(() => wheel.style.transition = '', spinDuration * 1000);
		}

		function getReward() {
			if (currentReward) {
				rewardText.innerHTML = currentReward.message;
			} else {
				rewardText.textContent = 'Please first spin the wheel.';
			}
		}

		spinButton.addEventListener('click', () => {
			spinWheel();
			rewardText.textContent = '';
		});
		rewardButton.addEventListener('click', getReward);